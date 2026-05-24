"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = void 0;
class SchemaManager {
    constructor(builder) {
        this.current = null;
        this.listeners = new Set();
        this.builder = builder;
    }
    /**
     * Rebuild the schema from the underlying data source. If the build
     * fails, the previous schema is retained.
     */
    async rebuild() {
        const next = await this.builder();
        this.current = next;
        for (const fn of this.listeners) {
            await fn(next);
        }
        return next;
    }
    /**
     * Return the current schema. Throws if `rebuild()` has not yet been
     * called — `server.ts` always invokes `rebuild()` once at startup, so
     * callers should never observe a null schema in practice.
     */
    getSchema() {
        if (!this.current) {
            throw new Error('SchemaManager: rebuild() has not been called yet');
        }
        return this.current;
    }
    /** Subscribe to schema changes; returns an unsubscribe function. */
    onChange(fn) {
        this.listeners.add(fn);
        return () => {
            this.listeners.delete(fn);
        };
    }
}
exports.SchemaManager = SchemaManager;
//# sourceMappingURL=schema-manager.js.map