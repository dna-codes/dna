## ADDED Requirements

### Requirement: The lens derives the Product-UI tree from the business graph

The product-app-preview lens SHALL build its view model by running the business→product projection over the current evaluated business graph, returning an `App → Module → Workflow → Page` tree whose nodes carry their stable projection key (`id`), `name`, `level`, and `planned` flag. The lens SHALL be read-only: building the view model SHALL NOT create, update, or delete instances or links in the store.

#### Scenario: Tree mirrors the projection

- **WHEN** the business graph contains a `Domain` with a `Process` and a `Task`
- **THEN** the lens returns an `App` containing a `Module` containing a `Page`, matching what `project()` derives

#### Scenario: Planned nodes are shown, not hidden

- **WHEN** a projected node has no forward backing (the projection marks it `planned`)
- **THEN** the node appears in the tree with `planned: true` rather than being omitted

#### Scenario: Building the view model does not mutate the store

- **WHEN** the lens view model is requested twice against an unchanged business graph
- **THEN** no product instances or links are created or removed by either request

### Requirement: The view model carries the coarse and fine gate inputs

The lens view model SHALL include an access snapshot sufficient to drive the two-grain gate: a `grants` list of `{ subject, surface }` derived from persisted `can_access` edges overlaid onto projected nodes by stable key, a `contains` list of `{ parent, child }` from the projection, and a `surfaceOperations` list of the operations each surface exposes. Subjects SHALL be emitted in the same role-name space the UI passes to the provider.

#### Scenario: Persisted can_access surfaces in the snapshot

- **WHEN** a persisted `Module` carries a `can_access` edge from role "Underwriter"
- **THEN** the snapshot's `grants` contains `{ subject: "Underwriter", surface: <that module's key> }`

#### Scenario: Containment is included for cascade resolution

- **WHEN** the projected tree contains an `App` that contains a `Module`
- **THEN** the snapshot's `contains` contains `{ parent: <app key>, child: <module key> }`

### Requirement: The panel gates surfaces and controls with the shipped gate components

The panel SHALL render inside a `<DnaProvider>` configured with the view model's access snapshot and the selected preview subject, wrapping each surface node in `<Surface id=…>` (coarse `can_access`) and each action control in `<Operation name=…>` (fine). A surface the subject cannot reach SHALL NOT render; within a rendered surface, an ungranted operation's control SHALL be gated by `<Operation>`.

#### Scenario: Coarse gate hides an unreachable surface

- **WHEN** the preview subject's roles have no `can_access` to a surface (directly or inherited via `contains`)
- **THEN** that surface is not rendered in the panel

#### Scenario: Fine gate closes a control within a reachable surface

- **WHEN** the subject can reach a surface but lacks the operation permission for a control on it
- **THEN** the surface renders and `<Operation>` closes the gate for that control

### Requirement: Preview-as subject selection re-gates the tree

The panel SHALL provide a preview-as control listing the roles present in the access snapshot, plus an author bypass that reveals all surfaces. Changing the selection SHALL re-resolve the coarse and fine gates against the new subject without reloading the lens data.

#### Scenario: Switching role changes what renders

- **WHEN** the user switches the preview-as selection from a role with no grant to a role granted `can_access` to an App
- **THEN** the App's surfaces become visible without re-fetching the lens

#### Scenario: Author bypass reveals all surfaces

- **WHEN** the user selects the author bypass
- **THEN** every surface in the tree renders regardless of `can_access`, and no real grant is created

### Requirement: The lens is available only in Operate mode

The product-app-preview lens SHALL be registered as an Operate-mode tab and SHALL NOT appear in Build mode. Agent `activate_lens` routing SHALL resolve the lens by its stable id only when the session is in Operate mode.

#### Scenario: Visible in Operate, hidden in Build

- **WHEN** the session mode is `operate`
- **THEN** the product-app-preview tab is shown; **WHEN** the mode is `build`, the tab is not shown
