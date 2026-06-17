## Context

The third change in the Product-UI-as-graph arc. The three-plane model and the two-edge-class ownership rule are defined in `product-ui-app-module-nodes/design.md`; the projection that materializes the nodes is `business-to-product-projection`. This change adds the **governance edge class** — the authored edges that give product surfaces independent access control — and positions them relative to the existing operation-level gate.

Existing machinery this builds on: `product-core-identity` (`User`, `Role`), `operation-gate` (`<Operation name>` renders children only when the current user's roles permit that operation per the Operational access `Rules`), and the doctrine that `Role.permissions[]` is a *derived rollup*, not authored truth.

## Goals / Non-Goals

**Goals:**
- `can_access` (Role/User → structural product node) and `assigned_to` (User → App) as first-class relationship types.
- A coarse, structural-level access gate that composes with the existing fine, operation-level gate.
- These edges are authored and survive re-derivation (they are the class `business-to-product-projection` must preserve).

**Non-Goals:**
- Changing operation-level permission resolution or the Operational access `Rules`.
- Re-deriving `can_access` from anything — it is authored, not a rollup.
- The render guard implementation details in every consumer (the doctrine is defined here; wiring is per-app).

## Decisions

### Decision: two access grains, composed

```
 coarse (this change)   Role ─can_access─▶ App/Module/Page      → is the whole surface visible?
 fine  (existing)       Role ─(Rules)────▶ Operation, gated at  → is this individual control enabled?
                                            <Operation> in a Component
```

A surface renders iff the coarse gate passes; within a visible surface, individual action controls are still governed by `<Operation>`. Coarse hides whole regions (a user with no `can_access` to the Lending app never sees it); fine disables specific buttons (a user in the app may still lack `Loan.Approve`). The two are independent and both must pass for an action to be performable.

*Why a separate edge rather than reusing operation Rules:* structural access is a product/navigation decision ("who gets this app"), not a business-rule decision ("who may approve a loan"). Conflating them would force every page to enumerate operation permissions; `can_access` lets you grant a whole surface in one edge while operations stay independently gated.

### Decision: `can_access` is authored governance, never derived

Unlike `Role.permissions[]` (a derived rollup), `can_access` is authored and is part of the governance edge class. `business-to-product-projection` preserves it across re-derivation by keying product nodes on stable identity. This is the concrete reason the projection needs stable identity in the first place.

### Decision: `assigned_to` is provisioning, distinct from `can_access`

`User ─assigned_to─▶ App` records that a user is provisioned into an app (their workspace), independent of role-based `can_access`. A user may have role-based access to many apps but be assigned (defaulted/homed) to one. Keeping them distinct avoids overloading one edge with "may use" and "works in."

## Risks / Trade-offs

- **Coarse/fine contradiction** (role can_access a Page but lacks every Operation the Page surfaces) → the Page renders but every control is disabled; surface this as a `planned`/empty state rather than a broken screen. Worth a lint ("granted access to a surface with no usable actions").
- **Inheritance down the hierarchy** — does `can_access` to an App imply access to its Modules? → Decide explicitly: default to *inherit down* (access to App grants its contained Modules/Pages unless a more specific `can_access` narrows it), to avoid edge explosion. (Open question below.)
- **Direct `User → can_access` grants** bypassing roles → allowed but discouraged; roles are the scalable path. Keep the edge type permitting both, document the preference.

## Resolved Questions

- **Inheritance semantics** → `can_access` **cascades down** `contains` (access to an App grants its contained Modules/Pages), **and a nested level may override** the inherited grant — a more specific `can_access` on a Module/Page takes precedence over what it inherits (to widen or narrow). Least authoring burden, with per-node control where needed.

## Open Questions

- Should `assigned_to` default from the Operational graph (a Person's primary Position's Domain → that App) as a derived default, with `can_access` still authored? (Possible synergy with the projection.)
