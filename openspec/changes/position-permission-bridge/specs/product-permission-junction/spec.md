## ADDED Requirements

### Requirement: Product `Permission` junction resource type

The product layer SHALL define a `Permission` resource type (`product/core/permission.json`) — a reified authorization, the product-layer parallel to operational `Membership`. Following the Actor › Action › Resource model (as in AWS Cedar), `Permission` SHALL reference a `principal` (a `User`), a `role` (the capacity / action-set), and a `scope` (the Resource slot — a namespaced entity reference, see below), with an optional `grant_reason`/provenance facet. `product.core.json` SHALL expose a `permissions[]` array. `Permission` is a `resource_type` (a node) — it is reified, not modeled as a bare edge, so that the `grants` relationship has a node to point at. It supersedes the former derived `permissions[]` string rollup on product `Role`.

#### Scenario: Permission reifies an Actor›Action›Resource authorization
- **WHEN** a Permission is materialized for principal `Kyle`, role `Approver`, scope `Alloc8::Groups::P&T`
- **THEN** it is a node with `principal`, `role`, and `scope` references and appears in `product.core.json` `permissions[]`

#### Scenario: Role permissions rollup superseded
- **WHEN** the product `Role` schema is loaded
- **THEN** the `permissions[]` string rollup is no longer the source of truth; per-scope authorization is expressed as `Permission` nodes

### Requirement: `Permission.scope` is a namespaced entity reference, not a new type

`Permission.scope` SHALL be a single Cedar-style qualified string (the Cedar `resource` slot) pointing at an entity that already exists in the graph — the product projection of an operational `Group`, or any product `Resource`. There SHALL NOT be a separate `Scope` resource type; the scope is the resource slot of the authorization, mirroring how operational `Position.scope` references a `Group` rather than defining a new type. The string SHALL be `::`-delimited and SHALL support arbitrary nesting depth (e.g. `Alloc8::Groups::P&T`, `Alloc8::Groups::P&T::Subteam::Platform`); it SHALL NOT be destructured into separate namespace/type/id fields. The validator SHALL resolve the qualified string to a known entity and flag unresolved references.

#### Scenario: Scope resolves to an existing entity
- **WHEN** a Permission declares `scope: "Alloc8::Groups::P&T"`
- **THEN** the reference resolves to the product entity projecting operational Group `P&T` (or a declared Resource), and no `Scope` node type is required

#### Scenario: Deeply nested scope is a single string
- **WHEN** a Permission declares `scope: "Alloc8::Groups::P&T::Subteam::Platform"`
- **THEN** it validates as one qualified string of arbitrary depth and resolves to the nested entity without introducing per-layer fields or types

#### Scenario: No Scope resource type exists
- **WHEN** the product core schemas are loaded
- **THEN** there is no `product/core/scope` schema; scope is a reference field on `Permission`

### Requirement: Permission is derive-first with author-fallback

A `Permission` SHALL be derived where an operational `Membership` and matching access `Rules` exist (see the projection capability), in which case it carries a backing `grants` edge. A `Permission` MAY also be hand-authored when no backing `Membership` exists, in which case it carries no `grants` edge but remains a valid node.

#### Scenario: Derived permission has a grants edge
- **WHEN** a Membership and a matching access Rule justify an authorization
- **THEN** the projection emits a Permission with a `grants` edge from that Membership

#### Scenario: Authored permission without backing membership
- **WHEN** a Permission is hand-authored with no operational Membership behind it (e.g. a service account)
- **THEN** it validates as a node with no `grants` edge

### Requirement: Permission identity is `{principal, role, scope}`

A `Permission` SHALL be uniquely identified by the tuple `{principal, role, scope}`. A later derivation that matches an already-authored Permission SHALL reconcile onto the same node (adding the `grants` edge) rather than create a duplicate.

#### Scenario: Derivation reconciles onto an authored permission
- **WHEN** a hand-authored Permission `{Kyle, Approver, Alloc8::Groups::P&T}` exists and the projection later derives the same tuple
- **THEN** no duplicate is created and a `grants` edge is added to the existing node
