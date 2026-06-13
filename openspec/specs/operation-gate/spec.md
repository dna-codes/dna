# operation-gate Specification

## Purpose
TBD - created by archiving change add-dna-react. Update Purpose after archive.
## Requirements
### Requirement: Operation renders children only when permitted and enabled
`<Operation name="…">` SHALL render its children when both the permission gate and the feature flag gate are open for the named operation. It SHALL render the `fallback` prop (defaulting to `null`) when either gate is closed. Permission is determined by the current user's resolved roles against the DNA access rules for the operation. The flag gate is determined by the `flags` resolver on `DnaProvider`.

#### Scenario: Children render when permitted and enabled
- **WHEN** the current user holds a role allowed by the operation's access rules AND the flags resolver returns true
- **THEN** `<Operation>` SHALL render its children

#### Scenario: Fallback renders when not permitted
- **WHEN** the current user holds no role in the operation's allow list
- **THEN** `<Operation>` SHALL render the `fallback` prop (or null if absent)

#### Scenario: Fallback renders when flag is disabled
- **WHEN** the flags resolver returns false for the operation name
- **THEN** `<Operation>` SHALL render the `fallback` prop regardless of the user's roles

#### Scenario: Children render when operation has no access rules
- **WHEN** the named operation has no access-type Rules in the DNA document
- **THEN** `<Operation>` SHALL render its children (open by default)

### Requirement: Operation renders a loading state while resolving
`<Operation>` SHALL render the `loading` prop (defaulting to `null`) while roles or flags are still being resolved asynchronously. Once resolution is complete, it SHALL transition immediately to children or fallback. The loading state SHALL NOT flash after the initial resolution is cached.

#### Scenario: Loading prop renders during async role resolution
- **WHEN** `resolveRoles` is async and has not yet returned
- **THEN** `<Operation loading={<Skeleton />}>` SHALL render the `<Skeleton />` component

#### Scenario: No flash on subsequent renders
- **WHEN** roles have been resolved and cached by the provider
- **THEN** re-renders of `<Operation>` SHALL not enter the loading state

### Requirement: Operation accepts fallback and loading as optional props
`<Operation>` SHALL accept `fallback` (ReactNode, default `null`) rendered when the gate is closed, and `loading` (ReactNode, default `null`) rendered while resolving. Both SHALL be optional. The component's required props are `name` (string) and `children` (ReactNode).

#### Scenario: Operation with no fallback renders null when gated
- **WHEN** `<Operation name="X">` has no `fallback` prop and the user is not permitted
- **THEN** nothing SHALL be rendered (null)

#### Scenario: Operation with fallback renders it when gated
- **WHEN** `<Operation name="X" fallback={<span>No access</span>}>` and the user is not permitted
- **THEN** `<span>No access</span>` SHALL be rendered

