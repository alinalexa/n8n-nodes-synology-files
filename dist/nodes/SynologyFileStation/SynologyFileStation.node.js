"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynologyFileStation = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const synoRequest_1 = require("../helpers/synoRequest");
class SynologyFileStation {
    constructor() {
        this.description = {
            displayName: 'Synology File Station',
            name: 'synologyFileStation',
            group: ['transform'],
            version: 1,
            description: 'List/Upload/Download/Create/Delete via Synology File Station API',
            defaults: { name: 'Synology File Station' },
            icon: 'file:icons/synology-light.svg',
            usableAsTool: true,
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'synologyDsmApi', required: true }],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Create Folder',
                            value: 'createFolder',
                            action: 'Create a folder',
                            description: 'Create a folder',
                        },
                        {
                            name: 'Delete',
                            value: 'delete',
                            action: 'Delete a file or folder',
                            description: 'Delete a file or folder',
                        },
                        {
                            name: 'Download',
                            value: 'download',
                            action: 'Download a file',
                            description: 'Download a file',
                        },
                        {
                            name: 'List',
                            value: 'list',
                            action: 'List files and folders',
                            description: 'List files and folders',
                        },
                        {
                            name: 'Move',
                            value: 'move',
                            action: 'Move files or folders',
                            description: 'Move files or folders',
                        },
                        {
                            name: 'Rename',
                            value: 'rename',
                            action: 'Rename a file or folder',
                            description: 'Rename a file or folder',
                        },
                        {
                            name: 'Upload',
                            value: 'upload',
                            action: 'Upload a file',
                            description: 'Upload a file',
                        },
                    ],
                    default: 'list',
                },
                {
                    displayName: 'Path',
                    name: 'path',
                    type: 'string',
                    default: '/',
                    required: true,
                    displayOptions: {
                        show: { operation: ['list', 'download', 'delete', 'rename'] },
                    },
                    description: 'For List: folder path. For Download/Delete/Rename: full path to the file/folder.',
                },
                {
                    displayName: 'Offset',
                    name: 'offset',
                    type: 'number',
                    typeOptions: { minValue: 0 },
                    default: 0,
                    displayOptions: { show: { operation: ['list'] } },
                    description: 'Starting offset for listing',
                },
                {
                    displayName: 'Limit',
                    name: 'limit',
                    type: 'number',
                    typeOptions: { minValue: 1, maxValue: 5000 },
                    default: 50,
                    displayOptions: { show: { operation: ['list'] } },
                    description: 'Max number of results to return',
                },
                {
                    displayName: 'Target Path',
                    name: 'targetPath',
                    type: 'string',
                    default: '/',
                    required: true,
                    displayOptions: { show: { operation: ['upload', 'createFolder', 'move'] } },
                    description: 'Target folder path',
                },
                {
                    displayName: 'Binary Property',
                    name: 'binaryProperty',
                    type: 'string',
                    default: 'data',
                    required: true,
                    displayOptions: { show: { operation: ['upload', 'download'] } },
                    description: 'Binary property containing the file to upload or where to store the downloaded file',
                },
                {
                    displayName: 'Overwrite',
                    name: 'overwrite',
                    type: 'boolean',
                    default: true,
                    displayOptions: { show: { operation: ['upload'] } },
                },
                {
                    displayName: 'Recursive Delete',
                    name: 'recursiveDelete',
                    type: 'boolean',
                    default: true,
                    displayOptions: { show: { operation: ['delete'] } },
                    description: 'Whether to delete folders recursively',
                },
                {
                    displayName: 'Source Paths (JSON Array)',
                    name: 'sourcePaths',
                    type: 'string',
                    default: '["/path/from1","/path/from2"]',
                    required: true,
                    displayOptions: { show: { operation: ['move'] } },
                    description: 'JSON array of files/folders to move. Example: ["\\/folder\\/a.txt","\\/folder\\/b.txt"].',
                },
                {
                    displayName: 'New Name',
                    name: 'newName',
                    type: 'string',
                    default: 'new-name',
                    required: true,
                    displayOptions: { show: { operation: ['rename'] } },
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const operation = this.getNodeParameter('operation', 0);
        const sid = await synoRequest_1.synoLogin.call(this);
        const results = [];
        for (let i = 0; i < items.length; i++) {
            if (operation === 'list') {
                const path = this.getNodeParameter('path', i);
                const offset = this.getNodeParameter('offset', i);
                const limit = this.getNodeParameter('limit', i);
                const res = await synoRequest_1.synoRequestJson.call(this, sid, {
                    method: 'GET',
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.List',
                        method: 'list',
                        version: 2,
                        folder_path: path,
                        offset,
                        limit,
                        additional: 'size,owner,time,real_path',
                    },
                });
                results.push({ json: res.data ?? res });
            }
            if (operation === 'createFolder') {
                const targetPath = this.getNodeParameter('targetPath', i);
                const folderName = 'new-folder';
                const res = await synoRequest_1.synoRequestJson.call(this, sid, {
                    method: 'GET',
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.CreateFolder',
                        method: 'create',
                        version: 2,
                        folder_path: targetPath,
                        name: folderName,
                        force_parent: 'true',
                    },
                });
                results.push({ json: res });
            }
            if (operation === 'upload') {
                const targetPath = this.getNodeParameter('targetPath', i);
                const binaryProp = this.getNodeParameter('binaryProperty', i);
                const overwrite = this.getNodeParameter('overwrite', i);
                const bin = this.helpers.assertBinaryData(i, binaryProp);
                const fileBuf = Buffer.from(bin.data, 'base64');
                const filename = bin.fileName || 'upload.bin';
                const res = await synoRequest_1.synoPostMultipart.call(this, sid, {
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.Upload',
                        method: 'upload',
                        version: 2,
                        path: targetPath,
                        overwrite: overwrite ? 'true' : 'false',
                        create_parents: 'true',
                    },
                    fields: {},
                    fileField: 'file',
                    fileBuffer: fileBuf,
                    filename,
                });
                results.push({ json: res });
            }
            if (operation === 'download') {
                const path = this.getNodeParameter('path', i);
                const binProp = this.getNodeParameter('binaryProperty', i);
                const buf = await synoRequest_1.synoRequestBinary.call(this, sid, {
                    method: 'GET',
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.Download',
                        method: 'download',
                        version: 2,
                        path,
                        mode: 'download',
                    },
                });
                const fileName = path.split('/').pop() || 'file';
                const binary = await this.helpers.prepareBinaryData(buf, fileName);
                results.push({ json: {}, binary: { [binProp]: binary } });
            }
            if (operation === 'delete') {
                const path = this.getNodeParameter('path', i);
                const recursiveDelete = this.getNodeParameter('recursiveDelete', i);
                const res = await synoRequest_1.synoRequestJson.call(this, sid, {
                    method: 'GET',
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.Delete',
                        method: 'delete',
                        version: 2,
                        path: JSON.stringify([path]),
                        recursive: recursiveDelete ? 'true' : 'false',
                    },
                });
                results.push({ json: res });
            }
            if (operation === 'move') {
                const sourcePathsRaw = this.getNodeParameter('sourcePaths', i);
                const targetPath = this.getNodeParameter('targetPath', i);
                let sourcePaths;
                try {
                    sourcePaths = JSON.parse(sourcePathsRaw);
                    if (!Array.isArray(sourcePaths))
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), '“Source Paths (JSON Array)” must be a JSON array of strings.');
                }
                catch {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), '“Source Paths (JSON Array)” must be a JSON array of strings.');
                }
                const res = await synoRequest_1.synoRequestJson.call(this, sid, {
                    method: 'GET',
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.Move',
                        method: 'start',
                        version: 2,
                        path: JSON.stringify(sourcePaths),
                        dest_folder_path: targetPath,
                        remove_src: 'true',
                        overwrite: 'true',
                    },
                });
                results.push({ json: res });
            }
            if (operation === 'rename') {
                const path = this.getNodeParameter('path', i);
                const newName = this.getNodeParameter('newName', i);
                const res = await synoRequest_1.synoRequestJson.call(this, sid, {
                    method: 'GET',
                    url: '/webapi/entry.cgi',
                    qs: {
                        api: 'SYNO.FileStation.Rename',
                        method: 'rename',
                        version: 2,
                        path: JSON.stringify([path]),
                        name: JSON.stringify([newName]),
                    },
                });
                results.push({ json: res });
            }
        }
        return this.prepareOutputData(results);
    }
}
exports.SynologyFileStation = SynologyFileStation;
//# sourceMappingURL=SynologyFileStation.node.js.map