import type { IncomingMessage, ServerResponse } from 'http';
import type { DnaDataStore, Stability, NounCategory, AttributeSchema } from '@dna-codes/dna-core';
export type { DnaDataStore };
/**
 * Session mode. `build` is type-focused (open registry — type-schema ops
 * allowed, types matured through the stability lifecycle); `operate` is
 * instance-focused (registry locked — type-schema ops rejected).
 */
export type SessionMode = 'build' | 'operate';
export type AuthMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void | Promise<void>;
export interface McpServerOptions {
    dataStore: DnaDataStore;
    /** Initial starter pack name. Defaults to 'operational'. */
    initialPack?: string;
    /**
     * Initial session mode. Defaults to 'build'. In 'operate' mode the registry
     * is locked: add_resource_type and add_relationship_type patch ops are rejected.
     */
    initialMode?: SessionMode;
    /** Called on POST /reset to obtain a fresh, empty store seeded with the given pack. */
    createFreshStore?: (pack?: string) => Promise<DnaDataStore>;
    authMiddleware?: AuthMiddleware;
}
export interface AddInstanceOp {
    op: 'add_instance';
    type: string;
    name: string;
    attributes?: Record<string, unknown>;
}
export interface RemoveInstanceOp {
    op: 'remove_instance';
    id: string;
    type: string;
}
export interface UpdateInstanceOp {
    op: 'update_instance';
    id: string;
    type: string;
    attributes: Record<string, unknown>;
}
export interface AddLinkOp {
    op: 'add_link';
    type: string;
    from: string;
    to: string;
}
export interface RemoveLinkOp {
    op: 'remove_link';
    id: string;
}
export interface AddResourceTypeOp {
    op: 'add_resource_type';
    name: string;
    category: NounCategory;
    description?: string;
    stability?: Stability;
    attribute_schema?: AttributeSchema;
}
export interface AddRelationshipTypeOp {
    op: 'add_relationship_type';
    name: string;
    from_type: string;
    to_type: string;
    description?: string;
    stability?: Stability;
}
export type PatchOp = AddInstanceOp | RemoveInstanceOp | UpdateInstanceOp | AddLinkOp | RemoveLinkOp | AddResourceTypeOp | AddRelationshipTypeOp;
export interface PatchResult {
    applied: number;
    ids: Record<number, string>;
}
export interface PatchError {
    error: string;
    violations: string[];
}
//# sourceMappingURL=types.d.ts.map