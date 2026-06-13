## ADDED Requirements

### Requirement: Structural access composes with the operation gate

The product UI SHALL apply access in two composed grains. The **coarse** grain hides a whole structural surface (`App`/`Module`/`Workflow`/`Page`) unless a `can_access` edge resolves for the current user's roles. The **fine** grain is the existing `<Operation name>` gate, which governs individual action controls within a visible surface. Both grains SHALL pass for a gated action to be performable: a surface the user cannot `can_access` is not rendered; within a rendered surface, an individual control is still gated by `<Operation>`.

#### Scenario: Coarse gate hides an unreachable surface

- **WHEN** the current user's roles have no `can_access` edge to a `Page`
- **THEN** the Page is not rendered, regardless of any operation-level permissions

#### Scenario: Fine gate still governs controls within a reachable surface

- **WHEN** the user can `can_access` a `Page` but lacks the operation permission for a button on it
- **THEN** the Page renders and `<Operation>` closes the gate for that button (fallback/disabled), per the existing operation-gate behavior

#### Scenario: Both grains required for an action

- **WHEN** an action requires both `can_access` to its surface and permission for its operation
- **THEN** the action is performable only when both the coarse and fine gates are open
