## 1. JSON Schemas — New UI Primitives

- [ ] 1.1 Create `packages/schemas/product/ui/workflow.json` — Workflow primitive (name, description, resource, pages[])
- [ ] 1.2 Create `packages/schemas/product/ui/section.json` — Section primitive (name, description, role, components[])
- [ ] 1.3 Create `packages/schemas/product/ui/component.json` — Component primitive (name, type, description, resource, operation, elements[])
- [ ] 1.4 Create `packages/schemas/product/ui/element.json` — Element primitive (name, type, description, field)
- [ ] 1.5 Create `packages/schemas/product/ui/operation.json` — UIOperation primitive (id, name, trigger, effects[]) with discriminated union effect types
- [ ] 1.6 Extend `packages/schemas/product/web/page.json` to accept optional `sections[]` and `components[]`
- [ ] 1.7 Extend `packages/schemas/product/product.ui.json` composite to accept optional `workflows[]` and `operations[]`

## 2. Core — Schema Registration

- [ ] 2.1 Register all five new schemas in `packages/core` so they appear in `availableSchemas()`
- [ ] 2.2 Extend `ResourceType` union to add `"workflow"`, `"page"` (if not already), `"section"`, `"component"`, `"element"`, `"ui-operation"`
- [ ] 2.3 Extend `RelationshipType` union to add `"contains"`, `"renders"`, `"triggers"`, `"navigates_to"`, `"calls"`, `"requires"`, `"updates"`
- [ ] 2.4 Add TypeScript types for `Workflow`, `Section`, `Component`, `Element`, and `UIOperation` in `packages/core`
- [ ] 2.5 Verify existing `product.ui.json` documents (lending example) still validate after composite schema changes

## 3. Core — Product UI Lens

- [ ] 3.1 Create `packages/core/lenses/product-ui.json` lens definition covering all five UI node types plus `ui-operation` and the seven relationship types
- [ ] 3.2 Register the `product-ui` lens in `packages/core/src/lenses/index.ts` and export from `allLenses()`
- [ ] 3.3 Write unit tests asserting the lens definition validates and `allLenses()` includes it

## 4. Core — Validation Tests

- [ ] 4.1 Write validation tests for `product/ui/workflow` (minimal, with pages, missing name, missing pages)
- [ ] 4.2 Write validation tests for `product/ui/section` (minimal, with components)
- [ ] 4.3 Write validation tests for `product/ui/component` (minimal, with operation ref, missing type)
- [ ] 4.4 Write validation tests for `product/ui/element` (minimal, with field ref)
- [ ] 4.5 Write validation tests for `product/ui/operation` (minimal, all effect types, unknown effect type fails, missing trigger fails, missing effects fails)
- [ ] 4.6 Write validation tests for updated composite `product.ui.json` (with workflows, with operations, existing doc without either still valid)

## 5. Output Adapter — Markdown

- [ ] 5.1 Extend `packages/adapters/src/output/markdown` to render `Workflow` nodes in the Product UI section
- [ ] 5.2 Extend markdown output to render `Section` → `Component` → `Element` hierarchy under each Page
- [ ] 5.3 Extend markdown output to render `UIOperation` entries with trigger and effects

## 6. Example

- [ ] 6.1 Add a `product.ui.json` document to `examples/react-app` (or a new `examples/ecommerce`) demonstrating Workflows, Components, Elements, and UIOperations
- [ ] 6.2 Verify the example validates against the updated schemas

## 7. Documentation

- [ ] 7.1 Update `README.md` — Product Layer section to document the new UI hierarchy and `UIOperation` primitive
- [ ] 7.2 Add `docs/concepts/product-ui.md` documenting the resources-and-relationships model for the Product UI layer, the Workflow/Page/Section/Component/Element hierarchy, UIOperation trigger+effects, and example graph queries
