/**
 * Generates `src/interpreter/openapi.ts` in the emitted fastify cell.
 *
 * Delegates the DNA → OpenAPI 3.1 render to `@dna-codes/dna-output-openapi` —
 * the canonical contract layer. Adding a Field type in DNA + extending
 * output-openapi propagates here automatically on next regen, with no
 * cba-side change. (See `flip-api-cell-to-output-openapi` for the rationale
 * and parity audit.)
 *
 * Post-processing covers the gap between what output-openapi emits today
 * and what the cba runtime expects on the spec:
 *
 *   - `securitySchemes.bearerAuth` + per-operation `security: [{ bearerAuth: [] }]`
 *     — cba's runtime hard-wires bearer auth. output-openapi v0.1 has no
 *     auth shape. 📝 sister proposal in `dna/` should extend output-openapi
 *     to derive this from a future Auth DNA shape; until then we shim.
 *   - `401/403/404` stub responses — descriptive only ("Unauthorized", etc.);
 *     cosmetic enough to keep local instead of noising the renderer.
 *   - `tags: ["${Resource}s"]` per operation — preserves the per-resource
 *     sidebar grouping the hand-rolled spec produced. output-openapi tags
 *     by namespace name today; extending it to derive resource tags is 📝
 *     candidate. Until then we override per-op.
 *   - `x-roles` from `core.rules` access entries — cba-internal extension;
 *     not appropriate upstream.
 *
 * Express adapter still uses the hand-rolled builder
 * (`src/adapters/node/express/generators/openapi.ts`); flipping it is a
 * separate proposal so any divergence in render shape is caught explicitly,
 * not bundled.
 */
export declare function generateOpenApi(): string;
//# sourceMappingURL=openapi.d.ts.map