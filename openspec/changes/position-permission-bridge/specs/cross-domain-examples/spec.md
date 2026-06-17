## MODIFIED Requirements

### Requirement: Per-domain shape assertions guard against silent registry-capability loss

Each cross-domain example's `operational.json` SHALL declare its organizational positions under a `positions[]` collection and reference them via `Membership.position` (renamed from `roles[]` / `Membership.role`). Per-domain shape assertions SHALL be updated to assert the `positions[]` / `Membership.position` shape. All seven examples (lending, mass-tort, marketplace, healthcare, manufacturing, education, registry) SHALL validate after the rename. Each example's demonstrated capabilities are otherwise unchanged.

#### Scenario: Examples use positions and Membership.position
- **WHEN** any example `operational.json` is validated
- **THEN** it declares `positions[]`, references them via `Membership.position`, and passes validation with no `roles[]` or `Membership.role` remaining

#### Scenario: System position example still validates
- **WHEN** the registry / manufacturing examples declare a `system: true` Position
- **THEN** validation passes with the same system-actor semantics formerly provided by a system Role
