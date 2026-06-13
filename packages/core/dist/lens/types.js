"use strict";
/**
 * Canonical lens-definition and lens-result types.
 *
 * A lens definition is declarative JSON (`packages/core/lenses/*.json`) validated
 * against the `meta/lens` JSON Schema. The {@link evaluateLens} runtime turns a
 * definition + a `DnaDataStore` into a matched subgraph (data lens) or type-graph
 * slice (schema lens). These types are a backward-compatible superset of the
 * original `{ $id, name, nodes, edges?, sentence? }` shape — every new field is
 * optional and `target` defaults to `'data'`, so existing all-free lens files
 * validate and load unchanged.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSchemaResult = isSchemaResult;
function isSchemaResult(r) {
    return r.resourceTypes !== undefined;
}
//# sourceMappingURL=types.js.map