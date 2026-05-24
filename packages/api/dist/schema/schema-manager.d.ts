/**
 * In-process schema manager. Owns the current `GraphQLSchema` and rebuilds
 * it on demand (after a successful `ResourceType` / `RelationshipType`
 * mutation).
 *
 * Subscribers receive the new schema reference via the `onChange` callback
 * — `server.ts` uses this to hot-swap Apollo's schema between requests.
 *
 * In-flight requests started before a rebuild complete against the
 * schema they started under; Apollo holds the schema reference for the
 * lifetime of the request, not per-resolver.
 */
import type { GraphQLSchema } from 'graphql';
export type SchemaListener = (schema: GraphQLSchema) => void | Promise<void>;
export declare class SchemaManager {
    private current;
    private readonly listeners;
    private readonly builder;
    constructor(builder: () => Promise<GraphQLSchema>);
    /**
     * Rebuild the schema from the underlying data source. If the build
     * fails, the previous schema is retained.
     */
    rebuild(): Promise<GraphQLSchema>;
    /**
     * Return the current schema. Throws if `rebuild()` has not yet been
     * called — `server.ts` always invokes `rebuild()` once at startup, so
     * callers should never observe a null schema in practice.
     */
    getSchema(): GraphQLSchema;
    /** Subscribe to schema changes; returns an unsubscribe function. */
    onChange(fn: SchemaListener): () => void;
}
//# sourceMappingURL=schema-manager.d.ts.map