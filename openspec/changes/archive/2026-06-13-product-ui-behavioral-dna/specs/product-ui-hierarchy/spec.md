## ADDED Requirements

### Requirement: Product UI defines a `Workflow` primitive
Product UI SHALL define a `Workflow` primitive at `product/ui/workflow` (`$id: https://dna.codes/schemas/product/ui/workflow`). A `Workflow` is a named UX-navigation grouping that contains one or more `Page` references — it is the container above `Page` in the UI hierarchy and is intentionally distinct from `Route` (which is URL resolution). `Workflow` SHALL declare a PascalCase `name` (string, required), an optional `description`, an optional `resource` mapping to the Operational resource it surfaces, and a `pages[]` array of page name strings referencing `Page` primitives in the same document. It SHALL compose the shared stability base so it MAY declare `stability`.

#### Scenario: Minimal Workflow validates
- **WHEN** a document `{ "name": "CreateUser", "pages": ["UserForm"] }` is validated against `product/ui/workflow`
- **THEN** validation SHALL pass

#### Scenario: Workflow missing name fails validation
- **WHEN** a `Workflow` document omits `name`
- **THEN** validation SHALL fail with an error indicating `name` is required

#### Scenario: Workflow missing pages fails validation
- **WHEN** a `Workflow` document omits `pages` or provides an empty array
- **THEN** validation SHALL fail

### Requirement: Product UI defines a `Section` primitive
Product UI SHALL define a `Section` primitive at `product/ui/section`. A `Section` is a named structural sub-region of a `Page`. It SHALL declare a PascalCase `name` (string, required), an optional `description`, an optional `role` (the semantic display role of the section, e.g. `"header"`, `"form"`, `"table"`, `"sidebar"`), and an optional `components[]` array of inline `Component` objects.

#### Scenario: Minimal Section validates
- **WHEN** a document `{ "name": "UserFormHeader" }` is validated against `product/ui/section`
- **THEN** validation SHALL pass

#### Scenario: Section with components validates
- **WHEN** a `Section` declares `components: [{ "name": "SaveButton", "type": "button" }]`
- **THEN** validation SHALL pass

### Requirement: Product UI defines a `Component` primitive
Product UI SHALL define a `Component` primitive at `product/ui/component`. A `Component` is a named, typed UI element within a `Section` or directly on a `Page`. It SHALL declare a PascalCase `name` (string, required), a `type` (string, required — e.g. `"button"`, `"form"`, `"table"`, `"dropdown"`, `"modal"`, `"input"`), an optional `description`, an optional `resource` reference, an optional `operation` reference (naming the Operational or Product Core operation this component surfaces), and an optional `elements[]` array of inline `Element` objects.

#### Scenario: Minimal Component validates
- **WHEN** a document `{ "name": "CreateButton", "type": "button" }` is validated against `product/ui/component`
- **THEN** validation SHALL pass

#### Scenario: Component with operation reference validates
- **WHEN** a `Component` declares `operation: "User.Create"`
- **THEN** validation SHALL pass

#### Scenario: Component missing type fails validation
- **WHEN** a `Component` document omits `type`
- **THEN** validation SHALL fail with an error indicating `type` is required

### Requirement: Product UI defines an `Element` primitive
Product UI SHALL define an `Element` primitive at `product/ui/element`. An `Element` is a named leaf-level UI node within a `Component` — an individual input, label, icon, or interactive control. It SHALL declare a PascalCase `name` (string, required), a `type` (string, required — e.g. `"input"`, `"label"`, `"icon"`, `"button"`, `"select"`), an optional `description`, and an optional `field` reference (naming a `Product Core Field` this element is bound to).

#### Scenario: Minimal Element validates
- **WHEN** a document `{ "name": "RoleDropdown", "type": "select" }` is validated against `product/ui/element`
- **THEN** validation SHALL pass

#### Scenario: Element with field reference validates
- **WHEN** an `Element` declares `field: "role"`
- **THEN** validation SHALL pass

### Requirement: Page accepts Sections and inline Components
The existing `product/ui/page` schema SHALL be extended to accept an optional `sections[]` array of `Section` objects and an optional `components[]` array of `Component` objects as direct children. Both arrays are optional. Existing `blocks[]` remain valid. `Page` MAY use either `blocks[]` (legacy) or `sections[]`/`components[]` (new) — they are not mutually exclusive.

#### Scenario: Page with sections validates
- **WHEN** a `Page` document declares `sections: [{ "name": "FormArea", "components": [{ "name": "SaveButton", "type": "button" }] }]`
- **THEN** validation SHALL pass

#### Scenario: Page with both blocks and sections validates
- **WHEN** a `Page` document declares both `blocks[]` and `sections[]`
- **THEN** validation SHALL pass (they coexist)

#### Scenario: Existing Page without sections or components still validates
- **WHEN** a `Page` document contains only `name`, `resource`, and `blocks[]`
- **THEN** validation SHALL pass unchanged

### Requirement: product.ui.json composite accepts Workflows
The `product.ui.json` composite schema SHALL accept an optional top-level `workflows[]` array whose items reference `product/ui/workflow`. Existing required fields (`layout`, `pages`, `routes`) are unchanged. A document without `workflows[]` remains valid.

#### Scenario: product.ui.json with workflows validates
- **WHEN** a `product.ui.json` document includes a valid `workflows[]` array
- **THEN** validation SHALL pass

#### Scenario: Existing product.ui.json without workflows still validates
- **WHEN** a `product.ui.json` document omits `workflows`
- **THEN** validation SHALL pass
