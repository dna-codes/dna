import http from 'http';
import type { McpServerOptions, SessionMode, PatchOp } from './types.js';
import type { DnaDataStore } from '@dna-codes/dna-core';
export { McpServerOptions };
export declare function validatePatchOps(ops: PatchOp[], store: DnaDataStore, mode?: SessionMode): Promise<string[]>;
export declare function createMcpServer(options: McpServerOptions): http.Server;
//# sourceMappingURL=server.d.ts.map