## 1. Governance relationship types

- [ ] 1.1 Register `can_access` (`Role`|`User` → `App`|`Module`|`Workflow`|`Page`) in `@dna-codes/dna-core`.
- [ ] 1.2 Register `assigned_to` (`User` → `App`).
- [ ] 1.3 Mark both as the authored governance edge class (documented as never derived; preserved by the projection).

## 2. Access resolution

- [ ] 2.1 Implement coarse structural-access resolution: a structural node is reachable iff `can_access` resolves for one of the current user's roles (or the user directly).
- [ ] 2.2 Implement cascade-down semantics over `contains` (App access ⇒ Module/Page access unless a narrower `can_access` overrides).
- [ ] 2.3 Wire the coarse gate into the product-UI render guard (`dna-provider`), composing with the existing `<Operation>` fine gate.

## 3. Composition with the operation gate

- [ ] 3.1 Ensure a surface the user cannot `can_access` is not rendered; within a rendered surface, `<Operation>` continues to gate individual controls.
- [ ] 3.2 Add a lint/warning when a role is granted `can_access` to a surface whose operations it can never perform (empty-surface).

## 4. Tests & docs

- [ ] 4.1 Tests: role with/without `can_access` shows/hides a surface; cascade-down grants reach contained nodes; `assigned_to` records provisioning; `can_access` survives a projection re-run.
- [ ] 4.2 Tests: coarse + fine composition — unreachable surface hidden; reachable surface with ungranted operation disables the control.
- [ ] 4.3 Document the two-grain access model and the governance edge class in the relevant package README/spec.
