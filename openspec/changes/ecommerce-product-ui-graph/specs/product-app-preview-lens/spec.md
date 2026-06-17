## ADDED Requirements

### Requirement: App Preview lens renders the materialized product-UI graph

The `product-app-preview` lens SHALL build its surface tree from the **materialized** product-UI instances in the store — instances of the registered product types (`App`/`Module`/`Workflow`/`Page`/`Section`/`Component`) connected by `contains` links — producing a tree rooted at each `App` and nesting `Module → Workflow → Page → Section → Component`.

#### Scenario: Authored tree is rendered from contains edges

- **WHEN** the store holds an `App` that `contains` a `Module` that `contains` a `Workflow` that `contains` a `Page`, and the `product-app-preview` lens is built
- **THEN** the view-model `roots` SHALL contain the App with the Module nested under it, the Workflow under the Module, and the Page under the Workflow

#### Scenario: Each preview node carries its level and name

- **WHEN** the lens renders a materialized node
- **THEN** the corresponding view-model node SHALL carry its `level` (one of `app`/`module`/`workflow`/`page`/`section`/`component`) and its display `name`

### Requirement: Components expose their UI type and pages expose their layout

For a materialized `Component`, the lens SHALL expose the Component's `type` field (the ui-library binding, e.g. `button`/`table`/`form`) on the view-model. For a materialized `Page`, the lens SHALL expose the Page's referenced `layout` name when present.

#### Scenario: Component type is surfaced

- **WHEN** a `Component` with `type: "table"` is rendered
- **THEN** the view-model entry for that component SHALL report `type` (or equivalent UI-component field) equal to `table`

#### Scenario: Page layout is surfaced

- **WHEN** a `Page` references `layout: "AdminLayout"`
- **THEN** the view-model entry for that page SHALL report `layout` equal to `AdminLayout`

### Requirement: Record tables derive from a Component's resource binding

When a `Component` declares a `resource` (the operational/business resource type it surfaces), the lens SHALL emit a `surfaceRecords` entry for the Component's owning page surface containing the instances of that resource type as rows, with display columns derived from the instances' business attributes (internal `_`-prefixed keys and `id` excluded from columns).

#### Scenario: Orders table is populated from the bound resource

- **WHEN** a `Component` of `type: "table"` bound to `resource: "order"` is on a Page, and `order` instances exist
- **THEN** the lens `surfaceRecords` SHALL include an entry for that page with `resourceType: "order"` and one row per `order` instance

### Requirement: Lens falls back to projection when nothing is materialized

When the store holds no materialized `App` instance, the `product-app-preview` lens SHALL fall back to building the tree from the pure `project()` derivation, preserving the previously-specified derived behavior.

#### Scenario: Un-materialized graph still renders

- **WHEN** the store has business nodes but no `App` instance, and the lens is built
- **THEN** the view-model SHALL be produced from `project()` (App→Module→Page→Component) exactly as before this change

### Requirement: Governance overlay is preserved

The lens SHALL continue to overlay authored `can_access` grants onto product surfaces and expose the distinct subjects, regardless of whether the tree was materialized or derived.

#### Scenario: can_access grants appear in the view-model

- **WHEN** a `Role` has a `can_access` link to a materialized `Module`
- **THEN** the lens `access.grants` SHALL include that subject→surface grant and `subjects` SHALL include the role

### Requirement: The dna-agent panel renders the tree with @dna/ui-library components

The dna-agent App Preview panel SHALL render the deep tree and, when a Page is opened, render its Sections and the Components within them mapped to `@dna/ui-library` elements by the Component `type` (e.g. `button → Button`, `card → Card`, `select → Select`). A `table` component SHALL render the page's bound record rows via the existing record-table renderer. An unmapped `type` SHALL render a labeled placeholder rather than failing.

#### Scenario: Navigating into a page renders its components

- **WHEN** the user opens a Page that contains a Section with a `button` Component and a `table` Component bound to `order`
- **THEN** the panel SHALL render a ui-library button and a table of the order rows under that page

#### Scenario: Unmapped component type degrades gracefully

- **WHEN** a Component declares a `type` with no ui-library mapping
- **THEN** the panel SHALL render a labeled placeholder for that component and SHALL NOT throw
