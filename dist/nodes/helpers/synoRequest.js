"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synoLogin = synoLogin;
exports.synoRequestJson = synoRequestJson;
exports.synoRequestBinary = synoRequestBinary;
exports.synoPostMultipart = synoPostMultipart;
const n8n_workflow_1 = require("n8n-workflow");
function toJsonValue(input) {
    if (input === null ||
        typeof input === 'string' ||
        typeof input === 'number' ||
        typeof input === 'boolean') {
        return input;
    }
    if (Array.isArray(input)) {
        return input.map((v) => toJsonValue(v));
    }
    if (typeof input === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(input)) {
            out[k] = toJsonValue(v);
        }
        return out;
    }
    return String(input);
}
function isJsonObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function asJsonObject(input) {
    const jv = toJsonValue(input);
    if (isJsonObject(jv))
        return jv;
    return { value: jv };
}
async function synoLogin() {
    const cred = await this.getCredentials('synologyDsmApi');
    const params = new URLSearchParams({
        api: 'SYNO.API.Auth',
        method: 'login',
        version: '7',
        account: String(cred.username),
        passwd: String(cred.password),
        session: 'FileStation',
        format: 'sid',
    }).toString();
    const optsPost = {
        method: 'POST',
        url: `${cred.baseUrl}/webapi/auth.cgi`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        json: true,
        skipSslCertificateValidation: cred.allowSelfSigned,
    };
    try {
        const auth = (await this.helpers.httpRequest(optsPost));
        if (!auth || auth.success !== true) {
            throw new n8n_workflow_1.NodeApiError(this.getNode(), asJsonObject(auth), {
                message: 'DSM login failed',
            });
        }
        const data = auth.data;
        return data.sid;
    }
    catch (originalError) {
        try {
            const rawOpts = { ...optsPost };
            delete rawOpts.json;
            const raw = (await this.helpers.httpRequest(rawOpts));
            throw new n8n_workflow_1.NodeApiError(this.getNode(), { raw }, {
                message: 'DSM login failed (non-JSON response)',
            });
        }
        catch {
            throw new n8n_workflow_1.NodeApiError(this.getNode(), asJsonObject(originalError), {
                message: 'DSM login failed',
            });
        }
    }
}
async function synoRequestJson(sid, options) {
    const cred = await this.getCredentials('synologyDsmApi');
    const headers = {
        Cookie: `id=${sid}`,
        ...(options.headers ?? {}),
    };
    const req = {
        method: 'GET',
        json: true,
        skipSslCertificateValidation: cred.allowSelfSigned,
        ...options,
        headers,
        url: `${cred.baseUrl}${options.url}`,
    };
    try {
        const response = (await this.helpers.httpRequest(req));
        return response;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), asJsonObject(error));
    }
}
async function synoRequestBinary(sid, options) {
    const cred = await this.getCredentials('synologyDsmApi');
    const headers = {
        Cookie: `id=${sid}`,
        ...(options.headers ?? {}),
    };
    const req = {
        method: 'GET',
        skipSslCertificateValidation: cred.allowSelfSigned,
        ...options,
        headers,
        url: `${cred.baseUrl}${options.url}`,
    };
    req.encoding = null;
    try {
        return (await this.helpers.httpRequest(req));
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), asJsonObject(error));
    }
}
async function synoPostMultipart(sid, options) {
    const cred = await this.getCredentials('synologyDsmApi');
    const { url, qs, fields, fileField, fileBuffer, filename } = options;
    const formData = {
        ...(fields ?? {}),
        [fileField]: { value: fileBuffer, options: { filename } },
    };
    const req = {
        method: 'POST',
        url: `${cred.baseUrl}${url}`,
        qs,
        headers: { Cookie: `id=${sid}` },
        json: true,
        skipSslCertificateValidation: cred.allowSelfSigned,
    };
    req.formData = formData;
    try {
        return (await this.helpers.httpRequest(req));
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), asJsonObject(error));
    }
}
//# sourceMappingURL=synoRequest.js.map