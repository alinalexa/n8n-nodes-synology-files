import type { IExecuteFunctions, IHttpRequestOptions, IDataObject } from 'n8n-workflow';
export declare function synoLogin(this: IExecuteFunctions): Promise<string>;
export declare function synoRequestJson(this: IExecuteFunctions, sid: string, options: IHttpRequestOptions): Promise<IDataObject>;
export declare function synoRequestBinary(this: IExecuteFunctions, sid: string, options: IHttpRequestOptions): Promise<Buffer>;
export declare function synoPostMultipart(this: IExecuteFunctions, sid: string, options: {
    url: string;
    qs?: IDataObject;
    fields?: Record<string, string | number | boolean>;
    fileField: string;
    fileBuffer: Buffer;
    filename: string;
}): Promise<IDataObject>;
