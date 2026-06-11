import { ParsedArgs } from './args';
/**
 * `cba up` — the full pipeline from DNA to running topology:
 *   validate → develop → deliver → adapter.launch
 *
 * Each step reuses the existing in-process command function; only the final
 * launch step shells out (to `docker compose` or `terraform`). If any step
 * fails it exits non-zero — the same behavior as running the commands by hand.
 */
export declare function runUp(argv: string[], args: ParsedArgs): void;
