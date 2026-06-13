# product-ui-operations Specification

## Purpose
TBD - created by archiving change product-ui-behavioral-dna. Update Purpose after archive.
## Requirements
### Requirement: Product UI defines a `UIOperation` primitive
Product UI SHALL define a `UIOperation` primitive at `product/ui/operation` (`$id: https://dna.codes/schemas/product/ui/operation`). A `UIOperation` is the product-layer behavioral analog of the Operational `Operation` — it names what happens when a user interaction occurs in the UI. It SHALL declare a kebab-case `id` (string, required — e.g. `"user.create.submit"`), a human-readable `name` (string, required), an optional `description`, a `trigger` object (required), and an `effects[]` array (required, minItems 1). It SHALL compose the shared stability base so it MAY declare `stability`.

#### Scenario: Minimal UIOperation validates
- **WHEN** a document `{ "id": "user.create.start", "name": "Start Create User", "trigger": { "component": "CreateButton", "event": "click" }, "effects": [{ "type": "navigate", "target": "CreateUserPage" }] }` is validated against `product/ui/operation`
- **THEN** validation SHALL pass

#### Scenario: UIOperation missing trigger fails validation
- **WHEN** a `UIOperation` document omits `trigger`
- **THEN** validation SHALL fail

#### Scenario: UIOperation missing effects or empty effects fails validation
- **WHEN** a `UIOperation` document omits `effects` or provides an empty array
- **THEN** validation SHALL fail

### Requirement: UIOperation.trigger identifies the component and event
`UIOperation.trigger` SHALL be an object with a required `component` (string — the PascalCase name of the `Component` that fires this interaction) and a required `event` (string — the interaction event, e.g. `"click"`, `"change"`, `"submit"`, `"blur"`). An optional `element` field (string) MAY narrow the trigger to a specific `Element` within the component.

#### Scenario: Trigger with component and event validates
- **WHEN** `trigger: { "component": "SaveButton", "event": "click" }` is provided
- **THEN** validation SHALL pass

#### Scenario: Trigger with element narrowing validates
- **WHEN** `trigger: { "component": "UserForm", "event": "submit", "element": "SaveButton" }` is provided
- **THEN** validation SHALL pass

#### Scenario: Trigger missing component fails validation
- **WHEN** `trigger` omits `component`
- **THEN** validation SHALL fail

### Requirement: UIOperation.effects is a discriminated union by `type`
Each item in `UIOperation.effects[]` SHALL be an object with a required `type` field that discriminates the effect kind. The following effect types SHALL be supported:

- `navigate` — `{ type: "navigate", target: string }` where `target` names a `Page` or `Workflow`
- `api` — `{ type: "api", target: string }` where `target` names a Product Core `Operation` or API `Endpoint`
- `state` — `{ type: "state", key: string, value?: string }` where `key` names a state variable and optional `value` is the value set
- `render` — `{ type: "render", component: string, visible?: boolean }` where `component` names a `Component` to show or hide
- `validate` — `{ type: "validate", target: string }` where `target` names the `Component` or `Section` to validate

#### Scenario: Navigate effect validates
- **WHEN** an effect `{ "type": "navigate", "target": "UserDetailPage" }` is provided
- **THEN** validation SHALL pass

#### Scenario: API effect validates
- **WHEN** an effect `{ "type": "api", "target": "User.Create" }` is provided
- **THEN** validation SHALL pass

#### Scenario: State effect validates
- **WHEN** an effect `{ "type": "state", "key": "selectedUserId" }` is provided
- **THEN** validation SHALL pass

#### Scenario: Render effect validates
- **WHEN** an effect `{ "type": "render", "component": "PermissionSelector", "visible": true }` is provided
- **THEN** validation SHALL pass

#### Scenario: Validate effect validates
- **WHEN** an effect `{ "type": "validate", "target": "UserForm" }` is provided
- **THEN** validation SHALL pass

#### Scenario: Unknown effect type fails validation
- **WHEN** an effect `{ "type": "toast", "message": "Saved!" }` is provided
- **THEN** validation SHALL fail because `"toast"` is not a member of the effect type union

### Requirement: product.ui.json composite accepts UIOperations
The `product.ui.json` composite schema SHALL accept an optional top-level `operations[]` array whose items reference `product/ui/operation`. Existing required fields are unchanged. A document without `operations[]` remains valid.

#### Scenario: product.ui.json with operations validates
- **WHEN** a `product.ui.json` document includes a valid `operations[]` array of `UIOperation` objects
- **THEN** validation SHALL pass

#### Scenario: Existing product.ui.json without operations still validates
- **WHEN** a `product.ui.json` document omits `operations`
- **THEN** validation SHALL pass

