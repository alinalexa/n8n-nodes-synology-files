import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';
export declare class SynologyDsmApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: Icon;
    documentationUrl: string;
    properties: INodeProperties[];
    test: {
        request: {
            baseURL: string;
            url: string;
            method: "GET";
            qs: {
                api: string;
                method: string;
                version: number;
                account: string;
                passwd: string;
                session: string;
                format: string;
            };
        };
    };
}
