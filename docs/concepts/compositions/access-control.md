# Access Control

> **DNA:** `User has Role within Scope granting Action against Resource [subject to Constraints]`

Composition binding several Lenses from the
[Operational Layer](../README.md#layers) (`User`, `Role`, `Action`,
`Resource`) plus the `Domain` Lens used as `Scope`.

## What it represents

The capability envelope of an actor — what an identified actor is permitted
to do, where, and against what.

This composition is the authorization projection of the operational graph.
It is *not* organizational structure (that's People) and
*not* a record of activity (that's Execution). It is the
*standing grant*: what *could* happen if the actor chose to act.

## Slots

Resource Types are written in `Code`, Relationship Types are written in
*italics* (their canonical surface words — see
[Relationship Types](../README.md#relationship-types)).

| Slot | Reads as |
|---|---|
| Subject | `User` |
| Assignment | *has* `Role` |
| Boundary | *within* `Scope` — a node in the [Domain](../resource-types.md#domain) hierarchy |
| Grant | *granting* `Action` |
| Target | *against* `Resource` |
| Modifier *(optional)* | *subject to* `Constraints` (cross-cutting, see [Modifiers](../README.md#modifiers)) |

## Examples

Long form:

```text
tim@firm.com
  has Case Reviewer
    within Litigation Workspace
      granting Approve
        against Plaintiff Record
```

Compact form — `Scope` is a dotted path through the `Domain` hierarchy,
`Resource` and `Action` follow:

```text
acme_corp.finance.payments:create
```

Here `acme_corp.finance` is the Scope (also the domain chain). The same
grant could be made at the org-level scope `acme_corp`, widening the
boundary.

## Useful for

- RBAC / ABAC hybrids
- Entitlements and policy engines
- Audit trails and security reviews
- Agent permissions (see Agent)
- Multi-tenant systems

## Related

| Composition | Relationship |
|---|---|
| People | Resolves *who* a `User` refers to (via `Person fills Position`) |
| Execution | The realised counterpart — what actually got done |
| Agent | Same shape, non-human subject (`Agent assumes Role…`) |
| Ownership | Often the source of `Scope` — groups that own resources confer scope |

## Resource Types used

`User`, `Role`, `Scope` (as `Domain` reference), `Action`, `Resource` —
see [Resource Types](../resource-types.md) for definitions, organized by
[Layer](../README.md#layers).

## Open questions

- **Membership.** Execution uses `acting through
  Membership` to bind a `User` to a `Role` at the moment of action. Access
  Control treats `Role` as a standing assignment — `Membership` is the
  binding object that makes both compositions consistent. Worth a dedicated
  section once Membership's shape is settled.
