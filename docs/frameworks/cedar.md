# DNA ↔ AWS Cedar

> **Canonical here.** This comparison has no page on [dna.codes/docs/frameworks](https://dna.codes/docs/frameworks); this file is the governing copy.

How DNA's Operational layer maps to **AWS Cedar** (the open-source policy language released by AWS in 2023). Cedar is an authorization policy language and evaluation engine — you author `permit`/`forbid` policies over `(principal, action, resource)` tuples and Cedar decides whether a given request is allowed. DNA is a description language whose Operational layer is built around the same triad: every `Operation` is a `Target.Action` pair, and every access `Rule.allow` grants a Role permission to perform one. Of all the frameworks DNA touches, Cedar is the closest in *shape* — the surface is almost identical for one slice, and almost completely disjoint for the rest. Teams already running Cedar will ask "isn't this just Cedar?" — the answer is "for one section of one layer, almost; everywhere else, no." This doc draws the line.

## Concept-by-concept mapping

| Cedar concept | DNA equivalent | Notes |
|---|---|---|
| `permit` policy effect | `Rule { type: "access", allow: [...] }` | Cedar's positive grant maps directly to DNA's only access-rule shape. A DNA Rule is implicitly `permit`-flavored — listing a Role in `allow[]` permits it. |
| `forbid` policy effect | *No DNA analog* | Cedar uses `forbid` for explicit denies that override permits. DNA models access positively only — see "Where DNA intentionally differs" below. |
| `principal` (the actor scope clause) | `Rule.allow[].role` | Cedar's `principal` is the entity making the request; DNA's `allow[].role` names the Role (or Person/Group used as actor) that may perform the Operation. |
| `principal == User::"alice"` | A specific `Person` referenced by name | Exact-match on a single identity. In DNA, name a Person directly in the actor primitive set; access Rules typically reference Roles, not individuals. |
| `principal in Role::"Underwriter"` | `allow: [{ role: "Underwriter" }]` plus a `Membership` binding the Person to the Role | Cedar's `in` walks the entity hierarchy (group/role membership). DNA splits this into two pieces: the Rule names the Role, and `Membership` declares which Persons hold that Role within which Group `scope`. |
| `action` (the verb scope clause) | The `action` half of an `Operation` (`Target.Action`) | Cedar's `action == Action::"Approve"` and DNA's `Loan.Approve` operation both name the verb. DNA always pairs the verb with its target in the operation name. |
| `action == Action::"Approve"` | `Operation { target: "Loan", action: "Approve", name: "Loan.Approve" }` | One Cedar action maps to one DNA Operation when paired with a target. |
| `action in [Action::"Read", Action::"Write"]` | Multiple Rules, or repeated `allow` entries across Operations | DNA has no "list of actions" sugar at the Rule level — one access Rule per Operation. |
| `resource` (the target scope clause) | The `target` half of an `Operation` | Cedar's `resource is Loan` and DNA's `target: "Loan"` field both name the protected noun. DNA's target may be any noun primitive — `Resource`, `Person`, `Role`, `Group`, or `Process` — not just resources. |
| `resource is Loan` | `Operation.target: "Loan"` (validated against declared nouns) | Cedar's `is` is a type check; DNA's target is resolved by the validator against `resources[]`, `persons[]`, `roles[]`, `groups[]`, and `processes[]`. |
| `when { ... }` condition | `Rule { type: "condition", conditions: [...] }` | Cedar's positive conditional (must hold) maps to DNA's condition Rules. DNA conditions are structured (`{ attribute, operator, value }`) rather than free-form expression syntax. |
| `unless { ... }` condition | *No direct analog* — invert the predicate into a positive `condition` Rule | DNA condition Rules are always "must hold." A Cedar `unless { resource.archived }` translates to a DNA condition asserting `resource.archived == false`. |
| `Action::"verb"` / `Resource::"type"` entity-type-and-uid syntax | Validator-resolved noun names (`Loan`, `Approve`) within a `Domain` path | Cedar namespaces every entity by type + uid; DNA namespaces by the dot-separated `Domain` path (`acme.finance.lending`) and uses unqualified PascalCase names within a domain document. |
| Entity store (the runtime data of principals/resources and their parent links) | *No DNA analog* — left to the Product and Technical layers | Cedar evaluates against a live store of entity instances and their hierarchy. DNA describes types and rules, not instances; the Product layer models retrievable resources and the Technical layer wires up persistence. |
| Cedar schema (entity types, action signatures, applies-to constraints) | The Operational + Product schemas together | Cedar schemas declare what types exist and which actions apply to which principal/resource types. DNA's JSON schemas play the same role for the Operational layer (declaring noun and Operation shapes) and the validator enforces applies-to via `Operation.target` and `Rule.operation`. |
| Policy evaluation engine (the `is_authorized` runtime) | *No DNA analog* — DNA is a description language, not a runtime | DNA emits descriptions; whether you reach an authorization decision at request time is the responsibility of whatever runtime the Technical layer wires up (which could itself be Cedar). |
| Policy templates and template-linked policies | *No DNA analog* | Cedar templates parameterize policies (`?principal`, `?resource`); DNA Rules are concrete and per-Operation. |

## Where DNA intentionally differs

1. **No `forbid`.** DNA models access positively. A Person without a matching `Rule.allow` entry can't perform an Operation; that's the only deny mechanism. Cedar's `forbid` exists because Cedar policies arrive from many sources (org-wide guardrails layered over team-local grants) and need a way to override `permit`. DNA's Rules are authored as a single coherent description per domain, so the layered-policy problem doesn't arise — and avoiding `forbid` keeps the access surface readable as a list of who-can-do-what without reasoning about override precedence.
2. **No policy-evaluation engine.** Cedar ships an authorization runtime (`is_authorized(request, policies, entities)`) that returns `Allow` or `Deny` plus diagnostics. DNA emits the description; reaching a decision at request time is a Technical-layer concern. A team can compile DNA `Rule.allow` entries into Cedar policies (or OPA rego, or in-app `if` checks) and run those in production. DNA stays neutral on which runtime authorizes the call.
3. **No entity store.** Cedar evaluates against live entity instances and their parent links. DNA doesn't model instances at all — it describes the *types* of nouns and their relationships. Identity at runtime (this specific Person, this specific Loan) lives at the Product layer (resources retrievable through APIs) and the Technical layer (the database). DNA leaves the question of "where does the entity store live" entirely open.
4. **Conditions are structured, not expressions.** Cedar's `when { resource.amount > 10000 }` is a small expression language. DNA's `conditions: [{ attribute, operator, value }]` is a fixed shape over a closed operator set (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `present`, `absent`). DNA trades expressiveness for static analyzability — every condition can be inspected without parsing.
5. **Roles aren't first-class principals at the policy site.** Cedar's `principal in Role::"Underwriter"` collapses identity, role, and group membership into one expression. DNA splits these: a `Person` (the identity), a `Role` (the position template, with `scope` declaring which `Group` type it's exercised within), and a `Membership` (binding a Person to a Role within a Group). The Rule references only the Role; the Membership graph determines which Persons currently match. The split is more verbose at authoring time and easier to introspect ("who currently holds this Role within this Group?") at runtime.
6. **No policy templates.** Cedar's templates parameterize over `?principal`/`?resource`. DNA Rules are written per-Operation against named Roles; the equivalent of a template is the Operation + Rule pair itself, instantiated once per protected verb.

## Concrete translation example

A Cedar policy permitting Underwriters to approve Loans, conditional on the loan being in a `pending` state:

```cedar
permit (
  principal in Role::"Underwriter",
  action == Action::"Approve",
  resource is Loan
)
when { resource.status == "pending" };
```

The DNA equivalent (drawn from [`examples/lending/operational.json`](../../examples/lending/operational.json)) is one Operation plus two Rules — an access Rule for the principal/action/resource scope and a condition Rule for the `when` clause:

```json
{
  "operations": [
    { "target": "Loan", "action": "Approve", "name": "Loan.Approve" }
  ],
  "rules": [
    { "operation": "Loan.Approve", "type": "access", "allow": [{ "role": "Underwriter" }] },
    {
      "name": "ApplicationIsPending",
      "operation": "Loan.Approve",
      "type": "condition",
      "conditions": [{ "attribute": "loan.status", "operator": "eq", "value": "pending" }]
    }
  ]
}
```

The shapes correspond piece-for-piece:

- Cedar `principal in Role::"Underwriter"` → DNA `allow: [{ role: "Underwriter" }]` (the Role is declared in `domain.roles[]`, with `scope: "BankDepartment"`; Memberships in `examples/lending/operational.json` bind `Employee` Persons to `Underwriter` within a department)
- Cedar `action == Action::"Approve"` + `resource is Loan` → DNA `Operation { target: "Loan", action: "Approve" }` (one combined declaration; the validator confirms `Approve` is in `Loan.actions[]`)
- Cedar `when { resource.status == "pending" }` → DNA condition Rule named `ApplicationIsPending`. The named condition Rule can also be referenced by `Step.conditions[]` inside a `Process`, which is an extra reuse path Cedar's inline `when` doesn't have.

What's missing on the DNA side, on purpose: there's no runtime that takes a `(principal, action, resource)` request and returns Allow/Deny. The Lending example *describes* who is allowed to approve; a Cedar policy generated from this DNA (or a hand-authored set of `if` checks) does the deciding at request time.

## See also

- [Framework comparisons index](./README.md) — full list of source frameworks DNA maps to
- [DDD](./ddd.md) — closest semantic neighbor; DDD's vocabulary for domain modeling sits behind both DNA's nouns/Operations and Cedar's principal/action/resource shape
- [Event Storming](./event-storming.md) — the workshop output (Commands, Events, Policies) translates into the same Operations and Rules that Cedar policies would protect
- [TOGAF](./togaf.md) — for positioning DNA inside an enterprise-architecture method that may also include policy languages like Cedar at the implementation layer
