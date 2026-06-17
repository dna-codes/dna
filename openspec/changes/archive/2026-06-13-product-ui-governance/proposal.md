## Why

Once App/Module/Page are real graph nodes (`product-ui-app-module-nodes`) derived from the business (`business-to-product-projection`), the payoff the user is after is **assigning users, roles, and access to those surfaces independently** — "Underwriters can use the Lending app," "this Module is only for Servicing staff" — coarse access at the structural level, distinct from the fine, operation-level gating that already exists (`<Operation>` + access Rules). Today access is only expressible at the Operation grain; there is no way to grant a Role access to an *App* or *Module*. This change adds the governance edge class and extends the gate doctrine up the structural hierarchy.

## What Changes

- Add a **`can_access`** relationship type: `Role → App|Module|Workflow|Page` (and `User → …` for direct grants). It is the coarse, structural-level access grant.
- Add an **`assigned_to`** relationship type: `User → App` (a user is provisioned into an app).
- Define these as the **governance edge class** — authored by humans/agents, owned independently of the projection, and never clobbered by re-derivation (the rule established in `product-ui-app-module-nodes`).
- Extend the gate doctrine: a structural node is **reachable** by a user iff a `can_access` edge resolves for one of the user's roles (coarse), AND the existing operation-level `<Operation>` gate stays the authority for individual actions (fine). Coarse gates hide whole surfaces; fine gates disable individual controls.
- `Role.permissions[]` remains the derived rollup from Operational Rules (unchanged); `can_access` is the new, separately-authored structural grant.

## Capabilities

### New Capabilities
- `product-ui-governance`: The `can_access` and `assigned_to` governance relationship types binding `User`/`Role` to product structural nodes (`App`/`Module`/`Workflow`/`Page`), their status as the authored edge class preserved across re-derivation, and the coarse structural-access gate layered above the existing operation-level gate.

### Modified Capabilities
- `operation-gate`: The gate doctrine is extended so structural product nodes can be access-gated by `can_access`; the `<Operation>` operation-level gate is unchanged but is positioned as the *fine* layer beneath the new *coarse* structural gate.

## Impact

- **`@dna-codes/dna-core`** — register `can_access` and `assigned_to` relationship types with the endpoint pairs above.
- **`dna-provider` / product UI guards** — a structural-access check resolves `can_access` for the current user's roles to decide whether a whole App/Module/Page renders.
- **Depends on** `product-ui-app-module-nodes` (the nodes these edges attach to) and the two-edge-class ownership rule; complements `business-to-product-projection` (governance edges are the class it must preserve).
- No change to `Role.permissions[]` derivation or to the Operational access `Rules`.
