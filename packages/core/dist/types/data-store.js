"use strict";
/**
 * Shared contract for runtime-data persistence backends, registry-native edition.
 *
 * A `DnaDataStore` persists:
 *
 *   1. **The type system itself**, as first-class `ResourceType` and
 *      `RelationshipType` records. Versioned — every update creates an
 *      immutable `ResourceTypeVersion` (or `RelationshipTypeVersion`) record
 *      and bumps the live record's `current_version`. The DNA file is a
 *      *seed* for these records on first boot; after that, admins own the
 *      type system through the API.
 *
 *   2. **Runtime data** — `Instance` records of each `ResourceType` and
 *      `Link` records (per `RelationshipType`) connecting Instances. Every
 *      Instance / Link carries a `_schemaVersion` stamp recording which
 *      `current_version` of its type was active when it was written.
 *
 * It is distinct from any future *descriptor* storage (a hypothetical
 * `DnaStore` that would persist the `OperationalDNA` document itself).
 * The DNA descriptor is *input* to a `DnaDataStore` (passed to
 * `seedFromDna(dna)` on first boot only), not data stored by it.
 *
 * Two implementations ship in `@dna-codes/dna-adapters`:
 *
 *   - `integration/memory` — zero-dep, recommended test double.
 *   - `integration/neo4j`  — backed by `neo4j-driver`; the production store.
 *
 * Transport wrappers (`dna-api`, future `dna-mcp` / `dna-cli`) depend on
 * this interface, not on a concrete implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeInUseError = void 0;
// ── Error sentinel ─────────────────────────────────────────────────────────
/**
 * Thrown by `resourceType.delete(id)` and `relationshipType.delete(id)` when
 * Instances or Links of the targeted type still exist and `cascade: true`
 * was not supplied. Adapters MUST throw this exact shape so callers can
 * match against it.
 */
class TypeInUseError extends Error {
    constructor(typeName, inUseCount) {
        super(`Cannot delete ${typeName}: ${inUseCount} instance(s) still exist. Pass { cascade: true } to delete them too.`);
        this.name = 'TypeInUseError';
        this.typeName = typeName;
        this.inUseCount = inUseCount;
    }
}
exports.TypeInUseError = TypeInUseError;
//# sourceMappingURL=data-store.js.map