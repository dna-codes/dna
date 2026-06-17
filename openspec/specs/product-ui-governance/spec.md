# product-ui-governance Specification

## Purpose

The authored governance edge class binding `User`/`Role` to product structural nodes (`App`/`Module`/`Workflow`/`Page`): the `can_access` and `assigned_to` relationship types, their status as edges preserved across projection re-derivation, and the coarse structural-access gate layered above the existing operation-level gate.

## Requirements

### Requirement: `can_access` grants structural access to a product surface

A `can_access` relationship type SHALL be registered, directed from a `Role` (or `User`, for direct grants) to a structural product node (`App`, `Module`, `Workflow`, or `Page`). It is the coarse, structural-level access grant — distinct from operation-level permission. A surface SHALL be visible to a user only when a `can_access` edge resolves for one of the user's roles (or for the user directly).

#### Scenario: Role with can_access sees the surface

- **WHEN** a `Role` "Underwriter" has a `can_access` edge to the `App` "Lending" and a user holds that role
- **THEN** the Lending app is reachable for that user

#### Scenario: No can_access hides the surface

- **WHEN** a user's roles have no `can_access` edge to the `App` "Lending"
- **THEN** the Lending app is not shown to that user

#### Scenario: can_access cascades down the contains hierarchy

- **WHEN** a `Role` has `can_access` to an `App` and no narrower grant exists on its `Module`s
- **THEN** the role can reach the App's contained Modules (access inherits down `contains`)

#### Scenario: a nested level overrides the inherited grant

- **WHEN** a `Role` has `can_access` to an `App` but a more specific `can_access` rule exists on a contained `Module`
- **THEN** the nested `Module` grant takes precedence over the inherited App grant (widening or narrowing access at that node)

### Requirement: `assigned_to` provisions a user into an app

An `assigned_to` relationship type SHALL be registered, directed from a `User` to an `App`, recording that the user is provisioned into (homed in) that app. It is distinct from `can_access`: a user MAY have role-based access to many apps while being assigned to one.

#### Scenario: User assigned to an app

- **WHEN** a `User` "Dana" has an `assigned_to` edge to the `App` "Lending"
- **THEN** "Lending" is recorded as Dana's assigned app, independent of which apps her roles can_access

### Requirement: Governance edges are authored and preserved across re-derivation

`can_access` and `assigned_to` SHALL be the authored governance edge class: they are created by humans or agents, never derived from the business graph, and SHALL be preserved when `business-to-product-projection` re-derives the product subgraph.

#### Scenario: can_access survives projection re-run

- **WHEN** a `can_access` edge points at a derived `Module` and the projection re-runs against an unchanged business graph
- **THEN** the `can_access` edge SHALL still exist

#### Scenario: can_access is not a derived rollup

- **WHEN** the registry is inspected
- **THEN** `can_access` SHALL NOT be materialized or overwritten by any derivation (unlike `Role.permissions[]`, which remains a derived rollup)
