import type { IExecuteFunctions, IHttpRequestOptions, IDataObject, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function synoLogin(this: IExecuteFunctions): Promise<string> {
	const cred = await this.getCredentials('synologyDsmApi');

	// Optional health check
	await this.helpers.httpRequest({
		method: 'GET',
		url: `${cred.baseUrl}/webapi/query.cgi`,
		qs: { api: 'SYNO.API.Info', method: 'query', version: 1, query: 'all' },
		json: true,
	});

	// Login to get SID
	const auth = (await this.helpers.httpRequest({
		method: 'GET',
		url: `${cred.baseUrl}/webapi/auth.cgi`,
		qs: {
			api: 'SYNO.API.Auth',
			method: 'login',
			version: 7,
			account: cred.username as string,
			passwd: cred.password as string,
			session: 'FileStation',
			format: 'sid',
		},
		json: true,
	})) as IDataObject;

	if (!auth || auth['success'] !== true) {
		// NodeApiError expects a JsonObject; cast safely
		throw new NodeApiError(this.getNode(), auth as JsonObject, {
			message: 'DSM login failed',
		});
	}
	const data = auth['data'] as IDataObject;
	return data['sid'] as string;
}

export async function synoRequestJson(
	this: IExecuteFunctions,
	sid: string,
	options: IHttpRequestOptions,
): Promise<IDataObject> {
	const cred = await this.getCredentials('synologyDsmApi');

	const req: IHttpRequestOptions = {
		method: 'GET',
		json: true,
		headers: { Cookie: `id=${sid}` },
		...options,
		url: `${cred.baseUrl}${options.url}`,
	};
	return (await this.helpers.httpRequest(req)) as IDataObject;
}

export async function synoRequestBinary(
	this: IExecuteFunctions,
	sid: string,
	options: IHttpRequestOptions,
): Promise<Buffer> {
	const cred = await this.getCredentials('synologyDsmApi');

	// Base typed object…
	const req: IHttpRequestOptions = {
		method: 'GET',
		headers: { Cookie: `id=${sid}` },
		...options,
		url: `${cred.baseUrl}${options.url}`,
	};

	// …then add runtime-only flag via cast (avoids TS errors in older typings)
	(req as unknown as { encoding: null }).encoding = null;

	const res = (await this.helpers.httpRequest(req)) as unknown as Buffer;
	return res;
}

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

	// Build formData with file LAST
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
	};

	// attach multipart body via cast to keep TS happy across n8n versions
	(req as unknown as { formData: MultipartFormData }).formData = formData;

	return (await this.helpers.httpRequest(req)) as IDataObject;
}
