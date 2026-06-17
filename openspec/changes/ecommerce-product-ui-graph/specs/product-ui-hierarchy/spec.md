## ADDED Requirements

### Requirement: Product UI defines a `Layout` primitive

Product UI SHALL define a `Layout` primitive (schema at `product/web/layout`). A `Layout` is a named, reusable page-wrapping structure (shared chrome such as header, sidebar, content, and footer regions). It SHALL declare a PascalCase `name` (string, required) and an optional `description`. A `Page` MAY reference a `Layout` by name via a `layout` field; a Layout is referenced by Pages rather than being a containment parent in the `App → Module → Workflow → Page` tree.

#### Scenario: Minimal Layout validates

- **WHEN** a document `{ "name": "AdminLayout" }` is validated against `product/web/layout`
- **THEN** it SHALL validate successfully

#### Scenario: A Page references a Layout by name

- **WHEN** a `Page` declares `layout: "AdminLayout"` and an `AdminLayout` Layout exists
- **THEN** the page SHALL be considered wrapped by that layout when rendered in the App Preview

#### Scenario: Layout missing name fails validation

- **WHEN** a `Layout` document omits `name`
- **THEN** validation SHALL fail
