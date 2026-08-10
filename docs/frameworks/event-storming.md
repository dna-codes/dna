# DNA ↔ Event Storming

> **Canonical version: [dna.codes/docs/frameworks#event-storming](https://dna.codes/docs/frameworks#event-storming).** The site carries the reader-facing copy and governs where the two differ. This file is kept for repo and offline readers.

How **Event Storming** workshop output translates into DNA. Event Storming (Alberto Brandolini, 2013) is a collaborative discovery technique — teams cover a wall with colored sticky notes representing what happens in their domain. The output is structurally close to DNA: the colors map almost 1:1.

> **Note (post-reorg, 2026-04):** This doc was written before the People/Structures/Activities reorg. Some examples reference the old "Resources-used-as-Roles" structural-typing model. The current shape splits Person, Role, Group, and Membership into first-class primitives — see [`README.md`](../../README.md) and [`ROADMAP.md`](../../ROADMAP.md). The conceptual mappings below still hold; concrete syntax examples may be outdated.

> Unlike the [BPMN](./bpmn.md), [DDD](./ddd.md), and [ArchiMate](./archimate.md) docs in this folder, this one isn't a notation comparison — Event Storming has no formal notation. It's a workshop. This doc explains how to take a wall full of stickies and produce a valid Operational DNA document.

## The sticky-note color → DNA mapping

The "Big Picture" + "Process Modeling" levels of Event Storming use a stable color vocabulary across most facilitators:

| Sticky | Workshop name | DNA primitive |
|---|---|---|
| 🟧 Orange | **Domain Event** ("OrderPlaced", "PaymentReceived") | No first-class event primitive in DNA today. State changes are modeled via `Operation.changes` on the producing Operation (e.g. `status → active`); the Operation that produced the event is the `Operation` itself. A dedicated event primitive will return when a real consumer (a downstream Trigger that reads emitted events) motivates it. |
| 🟦 Blue | **Command** ("PlaceOrder", "ApprovePayment") | `Operation` (Resource.Action) — the verb side becomes `Action`, paired with a Resource |
| 🟨 Yellow | **Actor** / **User** ("Customer", "Underwriter") | `Resource` referenced as actor — typically used as a Role on `Task.actor` and `Rule.allow[].role` |
| 🟪 Lavender / Purple | **Policy** ("Whenever X happens, then Y is initiated") | `Trigger` (`source: signal` or `source: operation`) targeting the downstream Operation/Process |
| 🟩 Light green | **Read Model** / **Information** ("Pending Orders dashboard") | Not in Operational DNA — surface as a Product UI Page or a Product API Endpoint at the next layer down |
| 🟫 Tan / Brown | **Aggregate** ("Order", "Account") | `Resource` (with attributes and actions) |
| 🟥 Red / Pink | **Hot spot / Question** ("not sure who owns this") | Not modeled — a workshop artifact, not a DNA primitive. Resolve before authoring DNA. |
| 🌐 Wide-light-blue | **External system** ("Stripe", "Salesforce") | `Resource` representing the external system + `Trigger` (`source: webhook`) for inbound events; or a separate `Domain` for the integration |

## Mapping a finished wall

A fully-Stormed slice of a domain reads left-to-right as a *narrative* — Actor places a Command, an Aggregate handles it, a Domain Event is published, a Policy reacts and triggers the next Command. That narrative collapses into DNA pieces in a deterministic way:

```
[Yellow Actor] —issues→ [Blue Command] —against→ [Tan Aggregate] —emits→ [Orange Event]
                                                                                 ↓
                                                                       [Purple Policy]
                                                                                 ↓
                                                                       [Blue Command]
```

becomes:

```
Resource (the Aggregate) {
  attributes: [...]
  actions: [Command verb]
}
Operation { target: <Aggregate>, action: <Command verb>, name: "Aggregate.Verb",
  changes: [{ attribute: <field>, set: <value> }] }
Resource (the Actor) — referenced from Rule.allow + Task.actor
Rule { operation: "Aggregate.Verb", type: "access", allow: [{role: <Actor>}] }
Trigger { operation: <next-Command's Operation>, source: "operation", after: "Aggregate.Verb" }
```

Every Storming chain across the wall produces one of these blocks; multiple chains compose into a full `operational.json`. The Policy ("when X happens, do Y") becomes a `Trigger` with `source: "operation"` + `after: <upstream-Operation>` — DNA has no Signal primitive, so the chain is expressed directly between the two Operations.

## Where the workshop output exceeds DNA

- **🟥 Hot spots** — questions, parking-lot items, contested ownership. These are the most valuable artifacts of the workshop and have no place in the resulting DNA. Resolve them with the team before authoring; the DNA is the post-decision artifact.
- **🟩 Read models** — "we need a dashboard of pending orders" is a UI/API requirement, not Operational. It maps to Product UI `Page` or Product API `Endpoint` at the next layer, not to anything in `operational.json`.
- **Bounded-context boundaries** — the wall typically gets divided into bounded contexts late in the workshop. These become DNA `Domain` nodes (`acme.finance.lending`); the boundary itself isn't a primitive but a path-prefix convention.
- **Chronological order** — the wall is laid out left-to-right by *when* things happen. DNA is unordered (collections are sets) — `Trigger.after` and `Step.depends_on` encode the chronology where it matters; the rest is graph-shaped, not timeline-shaped.

## Where DNA exceeds the workshop output

- **Scoping (Memberships + Role.scope)** — Event Storming captures Actors but not their *Group context*. "Underwriter" on a sticky doesn't tell you Underwriter-of-what. DNA forces you to declare Group-Resources and pin Memberships through them; the workshop typically discovers this implicitly and never writes it down.
- **Step-level orchestration (Process)** — Storming chains Commands via Policies, which is graph-shaped. DNA's `Process` introduces explicit `startStep`, `depends_on`, `conditions`, and `else` — useful for the SOPs you'll generate runnable workflows from. If your wall has a clear linear/branching flow, lift it into a Process; otherwise leave it as a chain of Policies (Triggers).
- **Explicit state mutations on Operations** — Event Storming events carry an implicit "what data does this carry" question. DNA's `Operation.changes[]` makes the state mutation explicit (which attribute on which Resource moved to which value). Workshop teams often leave the change as "we'll figure it out" — DNA forces the answer.

## Recommended workflow

1. **Run Event Storming as you normally would.** Don't try to bake DNA structure into the workshop — that interferes with the discovery purpose.
2. **At workshop end, take photos of the wall.** Resolve hot spots offline.
3. **Translate the wall into DNA in one pass**, color by color:
   - Tan stickies → declare `Resource` with the attributes and actions called out.
   - Blue stickies → declare `Operation` (Resource.Action) for each. Add `changes[]` for any state mutation the team called out on a neighboring orange sticky.
   - Orange stickies → not modeled directly (no event primitive). The state mutation lives on the producing Operation's `changes[]`; downstream reactions (purple stickies) hook in via `Trigger.after`, not via an emitted event.
   - Yellow stickies → declare `Person` or `Role` (whichever the actor really is — the workshop usually conflates them); set `scope` if a Group context is implied.
   - Purple stickies → declare `Trigger` with `source: "operation"` + `after: <upstream-Operation>` linking the producing Operation to the consuming one.
   - Light-green stickies → defer to the Product layer (UI Pages, API Endpoints).
4. **Validate with `@dna-codes/dna-core`.** Cross-layer validation catches reference errors (a Trigger pointing at an undeclared Signal, etc.).
5. **Iterate.** The first DNA pass usually surfaces gaps in the wall (un-scoped Roles, missing payload fields). Run a short follow-up with the team.

## Concrete translation example

A small Event Storming chain:

```
[Customer 🟨] —places→ [PlaceOrder 🟦] → [Order 🟫] —emits→ [OrderPlaced 🟧]
                                                                    ↓
                                                          [Whenever order placed,
                                                           charge payment 🟪]
                                                                    ↓
                                                       [ChargePayment 🟦] → [Payment 🟫]
                                                                    ↓
                                                            [PaymentCharged 🟧]
```

Translates to:

```json
{
  "domain": { "name": "checkout", "path": "shop.checkout", "resources": [
    { "name": "Order", "attributes": [{"name":"status","type":"string"}], "actions": [{ "name": "Place" }] },
    { "name": "Payment", "attributes": [{"name":"status","type":"string"}], "actions": [{ "name": "Charge" }] }
  ], "persons": [{ "name": "Customer" }]},
  "operations": [
    { "target": "Order",   "action": "Place",  "name": "Order.Place",     "changes": [{ "attribute": "status", "set": "placed" }] },
    { "target": "Payment", "action": "Charge", "name": "Payment.Charge",  "changes": [{ "attribute": "status", "set": "charged" }] }
  ],
  "rules": [
    { "operation": "Order.Place", "type": "access", "allow": [{ "role": "Customer" }] }
  ],
  "triggers": [
    { "operation": "Order.Place",    "source": "user" },
    { "operation": "Payment.Charge", "source": "operation", "after": "Order.Place" }
  ]
}
```

The Policy ("whenever order placed, charge payment") becomes a `Trigger` with `source: "operation"` + `after: "Order.Place"` on the downstream Operation. The Aggregate, the Command, and the Domain Event's state mutation all map deterministically — the event itself is implicit; what matters in the model is the upstream Operation that produced the change and the downstream Operation that reacts.

## See also

- [DDD](./ddd.md) — Event Storming was developed within the DDD community; the Aggregate / Bounded Context language carries over directly.
- [BPMN](./bpmn.md) — for converting the linear-narrative parts of a wall into a workflow notation.
