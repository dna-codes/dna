## 1. Capture the doctrine

- [x] 1.1 Separate the two senses of "pack" (vocabulary bundle vs. grouping) in `design.md`
- [x] 1.2 State graph-as-truth as the source-of-record principle
- [x] 1.3 Define a grouping as a node-anchored query (anchor + membership rule) in `design.md` and `specs/grouping-model/spec.md`
- [x] 1.4 Record that groupings overlap without coordination
- [x] 1.5 Flag the `tag-vs-node` subdomain-representation decision as the open question

## 2. Resolve home / tag-vs-node

- [x] 2.1 Resolve `tag-vs-node`: home = primary `belongs_to` edge to a `Domain` node; `path` = derived cache
- [x] 2.2 Unify home and grouping as one `belongs_to → Domain` primitive (primary flag = home)
- [x] 2.3 Make home mandatory; root `Domain` = the organization / tenant
- [x] 2.4 Identity-less groupings = saved lenses (governed by the identity test)
- [x] 2.5 Lenses classified as schema lenses vs data lenses (the node/edge × schema/data 2×2); a grouping = a data lens with a pinned anchor

## 3. Follow-on (out of scope here — explore/propose separately)

Disposition recorded in `design.md` → "Follow-on disposition". These are tracked as their own changes; this doctrine change carries no code.

- [x] 3.1 Define the concrete runtime lens evaluation mechanism (free/pinned bindings, traversal/scope); decide one unified lens schema vs distinct schema-lens/data-lens shapes — ✅ shipped as `runtime-lens-mechanism` (archived); open "one schema vs two" resolved to one unified `target`-discriminated schema
- [x] 3.2 Schema migration: drop containment arrays from `operational/domain.json`, demote `path` to derived cache — direction captured ("What this implies for the existing schemas"); deferred to a dedicated change (`domain-home-edge-migration`, not yet proposed), per this change's Non-Goals
- [x] 3.3 Revisit schema-folder / starter-pack layout purely as vocabulary distribution — ✅ reframed and shipped via `starter-pack-registry` + `derive-agent-pack-contract` (archived)
