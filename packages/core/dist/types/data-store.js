"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=data-store.js.map