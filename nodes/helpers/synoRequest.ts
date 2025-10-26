// nodes/helpers/synoRequest.ts
import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	IDataObject,
	JsonObject,
	JsonValue,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/** Convert arbitrary input into a JsonValue (deep), coercing non-JSON types to string. */
function toJsonValue(input: unknown): JsonValue {
	if (
		input === null ||
		typeof input === 'string' ||
		typeof input === 'number' ||
		typeof input === 'boolean'
	) {
		return input as JsonValue;
	}
	if (Array.isArray(input)) {
		return input.map((v) => toJsonValue(v)) as JsonValue;
	}
	if (typeof input === 'object') {
		const out: JsonObject = {};
		for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
			out[k] = toJsonValue(v);
		}
		return out;
	}
	// functions, symbols, undefined, etc.
	return String(input) as JsonValue;
}

function isJsonObject(v: JsonValue): v is JsonObject {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Safely coerce any value into a JsonObject for NodeApiError. */
function asJsonObject(input: unknown): JsonObject {
	const jv = toJsonValue(input);
	if (isJsonObject(jv)) return jv;
	return { value: jv };
}

/** Authenticate with Synology DSM and return a session ID (sid). */
export async function synoLogin(this: IExecuteFunctions): Promise<string> {
	const cred = await this.getCredentials('synologyDsmApi');

	// Build x-www-form-urlencoded body
	const params = new URLSearchParams({
		api: 'SYNO.API.Auth',
		method: 'login',
		version: '7',
		account: String(cred.username),
		passwd: String(cred.password),
		session: 'FileStation',
		format: 'sid',
	}).toString();

	const optsPost: IHttpRequestOptions = {
		method: 'POST',
		url: `${cred.baseUrl}/webapi/auth.cgi`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params,
		json: true,
		skipSslCertificateValidation: cred.allowSelfSigned as boolean,
	};

	try {
		const auth = (await this.helpers.httpRequest(optsPost)) as IDataObject;

		if (!auth || auth.success !== true) {
			throw new NodeApiError(this.getNode(), asJsonObject(auth), {
				message: 'DSM login failed',
			});
		}

		const data = auth.data as IDataObject;
		return data.sid as string;
	} catch (originalError: unknown) {
		// Retry without json to capture raw HTML if QuickConnect responds with non-JSON
		try {
			const rawOpts: IHttpRequestOptions = { ...optsPost };
			delete (rawOpts as unknown as { json?: boolean }).json;
			const raw = (await this.helpers.httpRequest(rawOpts)) as unknown as string;

			throw new NodeApiError(this.getNode(), { raw } as JsonObject, {
				message: 'DSM login failed (non-JSON response)',
			});
		} catch {
			throw new NodeApiError(this.getNode(), asJsonObject(originalError), {
				message: 'DSM login failed',
			});
		}
	}
}

/** Perform a JSON request with an existing DSM session. */
export async function synoRequestJson(
	this: IExecuteFunctions,
	sid: string,
	options: IHttpRequestOptions,
): Promise<IDataObject> {
	const cred = await this.getCredentials('synologyDsmApi');

	const headers = {
		Cookie: `id=${sid}`,
		...(options.headers ?? {}),
	};

	const req: IHttpRequestOptions = {
		method: 'GET',
		json: true,
		skipSslCertificateValidation: cred.allowSelfSigned as boolean,
		...options,
		headers,
		url: `${cred.baseUrl}${options.url}`,
	};

	try {
		const response = (await this.helpers.httpRequest(req)) as IDataObject;
		return response;
	} catch (error: unknown) {
		throw new NodeApiError(this.getNode(), asJsonObject(error));
	}
}

/** Perform a binary (Buffer) request with an existing DSM session. */
export async function synoRequestBinary(
	this: IExecuteFunctions,
	sid: string,
	options: IHttpRequestOptions,
): Promise<Buffer> {
	const cred = await this.getCredentials('synologyDsmApi');

	const headers = {
		Cookie: `id=${sid}`,
		...(options.headers ?? {}),
	};

	const req: IHttpRequestOptions = {
		method: 'GET',
		skipSslCertificateValidation: cred.allowSelfSigned as boolean,
		...options,
		headers,
		url: `${cred.baseUrl}${options.url}`,
	};

	// Ask for a Buffer (n8n-compatible across versions)
	(req as unknown as { encoding: null }).encoding = null;

	try {
		return (await this.helpers.httpRequest(req)) as unknown as Buffer;
	} catch (error: unknown) {
		throw new NodeApiError(this.getNode(), asJsonObject(error));
	}
}

/** Upload a file using multipart/form-data with an existing DSM session. */
type MultipartFileField = { value: Buffer; options: { filename: string } };
type MultipartFormData = Record<string, string | number | boolean | MultipartFileField>;

export async function synoPostMultipart(
	this: IExecuteFunctions,
	sid: string,
	options: {
		url: string;
		qs?: IDataObject;
		fields?: Record<string, string | number | boolean>;
		fileField: string;
		fileBuffer: Buffer;
		filename: string;
	},
): Promise<IDataObject> {
	const cred = await this.getCredentials('synologyDsmApi');
	const { url, qs, fields, fileField, fileBuffer, filename } = options;

	const formData: MultipartFormData = {
		...(fields ?? {}),
		[fileField]: { value: fileBuffer, options: { filename } },
	};

	const req: IHttpRequestOptions = {
		method: 'POST',
		url: `${cred.baseUrl}${url}`,
		qs,
		headers: { Cookie: `id=${sid}` },
		json: true,
		skipSslCertificateValidation: cred.allowSelfSigned as boolean,
	};

	// Attach multipart data (supported at runtime)
	(req as unknown as { formData: MultipartFormData }).formData = formData;

	try {
		return (await this.helpers.httpRequest(req)) as IDataObject;
	} catch (error: unknown) {
		throw new NodeApiError(this.getNode(), asJsonObject(error));
	}
}
