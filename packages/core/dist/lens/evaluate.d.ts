/**
 * Generic lens evaluator: turns a declarative {@link LensDefinition} into a
 * matched subgraph (data lens) or type-graph slice (schema lens) against any
 * `DnaDataStore`. Replaces per-lens hand-coded traversal.
 *
 * Algorithm (data lens):
 *   1. Seed   — resolve pinned slots (`ref`) to instances; with no pins, seed is
 *               every instance of the free slot types.
 *   2. Expand — for each `scope`, traverse `via` links in `direction` to `depth`
 *               from the seed, with a visited set for cycle termination.
 *   3. Edges  — include links of the declared free-edge relationship types
 *               between collected nodes.
 */
import type { DnaDataStore } from '../types/data-store';
import type { LensDefinition, LensResult } from './types';
/**
 * Evaluate a lens definition against a data store. Returns a subgraph
 * (`{ nodes, links }`) for a data lens, or a type-graph slice
 * (`{ resourceTypes, relationshipTypes }`) for a schema lens. Presentation is
 * a separate concern — this returns data only.
 */
export declare function evaluateLens(def: LensDefinition, store: DnaDataStore): Promise<LensResult>;
//# sourceMappingURL=evaluate.d.ts.map