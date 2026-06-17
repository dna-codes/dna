## ADDED Requirements

### Requirement: Projection derives Permission and grants from Memberships and Rules

The business→product projection SHALL emit, in addition to its existing nodes, a product `Permission` per operational `Membership` whose Person→Position and access `Rules` resolve to a concrete principal+role+scope authorization. For each derived `Permission` the projection SHALL emit a `grants` edge from the backing `Membership` to that `Permission`. The derivation rule is: `IF Membership(person → position → group) AND an access Rule allows that position on an operation within that group's scope THEN Permission{ principal: project(person), role: project(position), scope: ref(group) }` with `Membership --grants--> Permission`. `scope` is resolved as a namespaced entity reference to the projected Group (or referenced Resource) — no separate `Scope` node is emitted.

#### Scenario: Membership plus rule derives a permission with grants
- **WHEN** an operational Membership binds a Person to a Position in a Group, and an access Rule allows that Position on an operation scoped to that Group
- **THEN** the projection emits a `Permission{principal, role, scope}` and a `grants` edge from the Membership to it

#### Scenario: Scope is a reference, not a new node
- **WHEN** a Group is referenced by a derived Permission
- **THEN** the projection sets `Permission.scope` to a namespaced reference to that Group's product entity and emits no `Scope` node

### Requirement: Under-determined permissions are marked planned, not invented

When a Membership's Position→role or Group→scope mapping cannot be fully resolved (e.g. a multi-scope Position, or a Rule that names a Person rather than a Position), the projection SHALL NOT invent a `grants` edge. It SHALL either omit the Permission or emit it with the existing `planned` flag set, leaving the unresolved authorization reviewable.

#### Scenario: Multi-scope position does not auto-grant
- **WHEN** a Membership references a Position with multiple scopes and the Group does not disambiguate
- **THEN** the projection marks the candidate Permission `planned` and emits no `grants` edge
