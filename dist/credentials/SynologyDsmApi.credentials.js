"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynologyDsmApi = void 0;
class SynologyDsmApi {
    constructor() {
        this.name = 'synologyDsmApi';
        this.displayName = 'Synology DSM API';
        this.icon = {
            light: 'file:icons/synology-light.svg',
            dark: 'file:icons/synology-dark.svg',
        };
        this.documentationUrl = 'https://kb.synology.com/en-global/DSM/tutorial/How_to_use_File_Station_API';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://your-nas.quickconnect.to',
                placeholder: 'https://your-nas:5001',
                description: 'QuickConnect/DDNS/VPN base URL.',
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Password / App Password',
                name: 'password',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'Use a DSM 7 Application Password if 2FA is enabled.',
            },
            {
                displayName: 'Allow Self-signed TLS',
                name: 'allowSelfSigned',
                type: 'boolean',
                default: false,
                description: 'Skip TLS verification (not recommended).',
            },
        ];
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/webapi/auth.cgi',
                method: 'GET',
                qs: {
                    api: 'SYNO.API.Auth',
                    method: 'login',
                    version: 7,
                    account: '={{$credentials.username}}',
                    passwd: '={{$credentials.password}}',
                    session: 'FileStation',
                    format: 'sid',
                },
            },
        };
    }
}
exports.SynologyDsmApi = SynologyDsmApi;
//# sourceMappingURL=SynologyDsmApi.credentials.js.map