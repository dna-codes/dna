/**
 * Pure business→product projection.
 *
 * Walks an evaluated business subgraph by **node type** (a Domain's Processes are
 * the Process-typed nodes adjacent to it, etc. — independent of relationship-type
 * names, so it is robust to whichever vocabulary the graph uses) and derives the
 * product nodes the business implies:
 *
 *   Domain → App        Process → Module     Task → Page     Operation → Component
 *   Domain → Namespace (API)                 Operation → Endpoint (API)
 *
 * Each node carries a stable identity key and a `planned` flag set wherever the
 * forward backing (Domain→Process→Task→Operation→`changes`) is missing. Writes
 * nothing — `apply()` (persistence) is a deferred follow-on.
 */
import type { LensDataResult } from '../lens/types';
import type { ProductSubgraph, ProjectOptions } from './types';
export declare function project(business: LensDataResult, opts?: ProjectOptions): ProductSubgraph;
//# sourceMappingURL=project.d.ts.map