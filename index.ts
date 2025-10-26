import { SynologyFileStation } from './nodes/SynologyFileStation/SynologyFileStation.node';
import { SynologyDsmApi } from './credentials/SynologyDsmApi.credentials';

export const nodes = [SynologyFileStation];
export const credentials = [SynologyDsmApi];
