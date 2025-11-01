"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = exports.nodes = void 0;
const SynologyFileStation_node_1 = require("./nodes/SynologyFileStation/SynologyFileStation.node");
const SynologyDsmApi_credentials_1 = require("./credentials/SynologyDsmApi.credentials");
exports.nodes = [SynologyFileStation_node_1.SynologyFileStation];
exports.credentials = [SynologyDsmApi_credentials_1.SynologyDsmApi];
//# sourceMappingURL=index.js.map