## 1. App & Module schemas

- [x] 1.1 Add `packages/schemas/product/ui/app.json` (`$id` …/product/ui/app; name required, description, realizes, modules[]; `allOf` stability base), mirroring `workflow.json`.
- [x] 1.2 Add `packages/schemas/product/ui/module.json` (name required, description, realizes, workflows[], pages[]; stability base).
- [x] 1.3 Register both schemas in `@dna-codes/dna-core` (`packages/core/src/index.ts` `allSchemas()`); confirm they appear in `availableSchemas()` and resolve cross-schema `$ref`s.

## 2. Product UI lens edges & nodes

- [x] 2.1 Extend `packages/core/lenses/product-ui.json` nodes with `app`, `module`, `endpoint`, `namespace` slots (types App/Module/Endpoint/Namespace).
- [x] 2.2 Add `contains` edges: `app → module`, `module → workflow`, `module → page`.
- [x] 2.3 Add `realized_as` edges: app→domain/group, module→domain/process, workflow/page→process/step, section→step, component→operation, namespace→domain.
- [x] 2.4 Add the `exposes` edge: `endpoint → operation` (derived from the endpoint's `operation` field).

## 3. Composite

- [x] 3.1 Extend `packages/schemas/product/product.ui.json` to accept optional top-level `apps[]` and `modules[]` arrays (existing fields unchanged; documents without them still validate).

## 4. Tests & docs

- [x] 4.1 Validation tests: minimal App/Module validate; App realizing a Domain and Module realizing a Process validate; `product.ui.json` with and without apps/modules validate.
- [x] 4.2 Lens test: `product-ui` lens nodes include app/module/endpoint/namespace and edges include `realized_as` and `exposes`.
- [x] 4.3 Update the package README/spec docs for the extended hierarchy and the `realized_as`/`exposes` edges (reusing Endpoint/Namespace, not new API types).
