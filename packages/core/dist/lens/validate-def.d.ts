/**
 * Validate a lens definition against the `meta/lens` JSON Schema, plus the two
 * semantic rules the schema can't express: pinning is allowed only on data
 * lenses, and every `scope.from` must reference a pinned slot.
 */
import type { LensDefinition } from './types';
export interface LensDefValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateLensDefinition(def: LensDefinition): LensDefValidation;
//# sourceMappingURL=validate-def.d.ts.map