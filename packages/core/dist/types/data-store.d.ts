/**
 * Shared contract for runtime-data persistence backends.
 *
 * A `DnaDataStore` persists the *runtime data* described by an
 * `OperationalDNA` — actual Loan records, Borrower records, the Links
 * between them — using the registry triad shape (TypeDefinition / Instance
 * / Link) demonstrated in `examples/registry`.
 *
 * It is distinct from any future *descriptor* storage (a hypothetical
 * `DnaStore` that would persist the `OperationalDNA` document itself).
 * The DNA descriptor is *input* to a `DnaDataStore` (passed at construction
 * by each concrete factory), not data stored by it.
 *
 * Two implementations ship in `@dna-codes/dna-adapters`:
 *
 *   - `integration/memory` — zero-dep, recommended test double.
 *   - `integration/neo4j`  — backed by `neo4j-driver`; the production store.
 *
 * Transport wrappers (`dna-mcp`, `dna-api`, `dna-cli`) depend on this
 * interface, not on a concrete implementation.
 */
/** Endpoint of a Link — the typed identity of an Instance. */
export interface InstanceRef {
    typeName: string;
    id: string;
}
/** Optional fields a caller can pass when creating a Link. */
export interface LinkCreateOptions {
    /** Caller-provided Link ID. If omitted, the adapter generates a UUIDv4. */
    id?: string;
    /** Discriminator for role assignments (e.g. `"primary_borrower"`). Absent for plain references. */
    role?: string;
    /** Role-specific payload (e.g. `{ assigned_at: "2026-05-23" }`). */
    attributes?: Record<string, unknown>;
}
/** A Link record as returned by `link.list()`. */
export interface LinkRecord {
    id: string;
    from: InstanceRef;
    to: InstanceRef;
    role?: string;
    attributes?: Record<string, unknown>;
}
/** Optional filter for `link.list()`. Provide any subset of fields. */
export interface LinkListFilter {
    from?: InstanceRef;
    to?: InstanceRef;
    role?: string;
}
/** Instance record as returned by `instance.get()` / `instance.list()`. */
export type InstanceRecord = Record<string, unknown> & {
    id: string;
};
/** Payload accepted by `instance.create()`. `id` is optional (hybrid assignment). */
export type InstanceCreateInput = Record<string, unknown> & {
    id?: string;
};
/**
 * Runtime-data persistence interface.
 *
 * Concrete adapters are constructed with an `OperationalDNA` so they know
 * the type system; `migrate()` seeds TypeDefinition / RelationshipDef
 * metadata from the DNA's noun primitives.
 */
export interface DnaDataStore {
    /**
     * Seed TypeDefinition / RelationshipDef metadata from the constructor DNA
     * and create any backend-specific constraints / indexes. Idempotent —
     * safe to call on every startup.
     */
    migrate(): Promise<void>;
    /** Per-Instance CRUD scoped by Resource/Person/Role/Group `typeName`. */
    instance: {
        /**
         * Create an Instance of `typeName` with the given data payload. If
         * `data.id` is present, that ID is used (and collisions throw). If
         * absent, a UUIDv4 is generated. The resolved ID is returned.
         */
        create(typeName: string, data: InstanceCreateInput): Promise<{
            id: string;
        }>;
        /** Return the stored record (sans reserved props), or `null` on miss. */
        get(typeName: string, id: string): Promise<InstanceRecord | null>;
        /** Shallow-merge `patch` onto the existing record. Throws on missing. */
        update(typeName: string, id: string, patch: Record<string, unknown>): Promise<void>;
        /** Remove the Instance. No-op on missing. */
        delete(typeName: string, id: string): Promise<void>;
        /** List every Instance of `typeName`. */
        list(typeName: string): Promise<InstanceRecord[]>;
    };
    /** Link CRUD. Each Link connects two Instances and may carry a role + attributes. */
    link: {
        /** Create a Link. Returns the resolved Link ID. */
        create(from: InstanceRef, to: InstanceRef, opts?: LinkCreateOptions): Promise<{
            id: string;
        }>;
        /** Remove a Link by its ID. No-op on missing. */
        delete(linkId: string): Promise<void>;
        /** List Links, optionally filtered by `from`, `to`, and/or `role`. */
        list(filter?: LinkListFilter): Promise<LinkRecord[]>;
    };
    /** Release any backend resources (e.g. database driver). No-op for in-memory adapters. */
    close(): Promise<void>;
}
//# sourceMappingURL=data-store.d.ts.map