# DNA ↔ Domain-Driven Design

> **Canonical version: [dna.codes/docs/frameworks#ddd](https://dna.codes/docs/frameworks#ddd).** The site carries the reader-facing copy and governs where the two differ. This file is kept for repo and offline readers.

How DNA's operational layer maps to **Domain-Driven Design** (Eric Evans, 2003). DDD is a methodology + vocabulary for modeling business domains in code; DNA is the same vocabulary expressed declaratively as JSON. Of all the frameworks DNA touches, DDD is the closest in spirit — both treat the business domain as the source of truth and code as a downstream concern.

> **Note (post-reorg, 2026-04):** This doc was written before the People/Structures/Activities reorg. Some examples reference the old "Resources-used-as-Roles" structural-typing model. The current shape splits Person, Role, Group, and Membership into first-class primitives — see [`README.md`](../../README.md) and [`ROADMAP.md`](../../ROADMAP.md). The conceptual mappings below still hold; concrete syntax examples may be outdated.

## Concept-by-concept mapping

| DDD concept | DNA equivalent | Notes |
|---|---|---|
| **Bounded Context** | `Domain` (a node in the dot-separated hierarchy) | DDD uses bounded contexts to draw model boundaries; DNA uses `Domain` (`acme.finance.lending`) for the same purpose. Resources, Operations, etc. are scoped to a Domain via the `domain` field. |
| **Ubiquitous Language** | The Resource + Action + Operation + Role names you author | DNA is, by design, a Ubiquitous Language artifact — every primitive name is the team's vocabulary. The schemas enforce only naming patterns, not semantics. |
| **Entity** | `Resource` (with attributes; identity-bearing) | A Resource with attributes including an `id` is an Entity. DNA doesn't formally distinguish Entities from Value Objects in v1 — the distinction is in usage, not declaration. |
| **Value Object** | `Resource` without lifecycle, *or* nested attribute structure | DNA doesn't have a separate Value Object primitive. A Resource without Actions is value-object-shaped; richer value objects are typically modeled as nested attributes on the owning Entity Resource. |
| **Aggregate** | A `Resource` plus the Resources it transitively owns via `Relationship` | DNA doesn't have an Aggregate primitive. The aggregate root is the Resource that holds the operations modifying it; consistency boundaries are documented via Relationships and enforced by Operation-level Rules. |
| **Aggregate Root** | A `Resource` referenced by name from `Operation.resource` | The Resource an Operation acts on is, in DDD terms, the aggregate root for that change. |
| **Repository** | Not modeled in DNA (Technical layer concern) | Repositories are persistence abstractions — they belong in `db-cell` or similar Technical-layer constructs, not in business logic. |
| **Domain Service** | `Operation` not naturally owned by one Resource | DDD puts cross-aggregate behavior in services. DNA forces the `Resource.Action` shape — when no single Resource is the natural owner, you choose the most-tracked one and model it there, or add a coordinating Resource. The discipline tends to surface missing entities. |
| **Application Service** | A `Process` (orchestrating multiple Operations) | DDD's application services orchestrate work across aggregates. In DNA, that's a `Process` — DAG of Steps, each a Task, each binding an Actor to an Operation. |
| **Factory** | Not modeled (Technical layer concern) | Factories construct aggregates; that's runtime code, not business description. |
| **Domain Event** | `Operation.changes` (state mutation) + `Trigger.after` (downstream reaction) | DDD's domain events fire when the model changes meaningfully. DNA currently has no first-class event primitive; the state-change side of "an event happened" lives in `Operation.changes` (the producing Operation owns the mutation), and the orchestration side lives in `Trigger.after` (a downstream Trigger fires when an upstream Operation completes). A first-class event primitive will return when a real consumer motivates it. |
| **Anti-Corruption Layer** | A separate `Domain` with translation `Operations` | DDD places ACLs at integration boundaries. DNA expresses the boundary as a Domain (e.g., `acme.integrations.salesforce`) whose Resources/Operations translate external shapes into internal vocabulary. |
| **Context Map** (Shared Kernel, Customer/Supplier, Conformist, etc.) | Documented relationships between Domains | DNA doesn't formalize context-map relationships; in practice they live in `description` annotations and Operation chains via `Trigger.source = operation`. |
| **Specification pattern** | `Rule` (`type: condition`) | DDD specifications encapsulate business predicates. DNA's condition Rules are the same idea, named (so Steps can compose them via `Step.conditions`) and reusable across Operations. |
| **Strategic Design** (Distillation, Core Domain, Generic Subdomain, Supporting Subdomain) | Documentation overlay on the Domain hierarchy | Not a primitive in v1. The Domain hierarchy provides the structure; "this is the core" is metadata you'd add to a Domain's `description` or in supplementary docs. |

## Where DNA intentionally differs

1. **DNA doesn't formalize Aggregates.** The aggregate concept is one of DDD's most-debated; DNA opts out by not modeling it directly. Operations still respect aggregate-style consistency (a Loan.Approve operates on one Loan), but you don't draw the boundary explicitly. Relationships document associations; Rules enforce invariants.
2. **DNA doesn't distinguish Entity from Value Object at the schema level.** Both are Resources. The distinction matters in implementation (mutable vs immutable, identity vs equality) and is preserved at the Technical layer, not the description.
3. **DNA's Process is more concrete than DDD's Application Service.** A Process is a literal DAG of named Steps with explicit `startStep`, conditions, and dependencies — closer to a workflow notation than a service interface.
4. **DNA's Actor model is structural, not aggregate-bound.** Actors (Roles, Users, Groups — all Resources) live alongside business Entities. DDD typically pushes user/role concepts to the application layer; DNA elevates them because authorization and assignment are business rules.
5. **DNA's Signal is tighter than a domain event.** Signals carry a typed payload contract, are fully-qualified (`domain.Resource.PastTenseAction`), and are part of the published surface. DDD domain events are often implementation-private; DNA Signals are explicitly cross-domain.

## Concrete translation example

A DDD model for the Lending bounded context:

- **Bounded Context**: Lending
- **Aggregates**: Loan (root), with Borrower as a separate aggregate
- **Domain Events**: LoanApplied, LoanApproved, LoanDisbursed
- **Domain Services**: ApplyLoan, ApproveLoan, DisburseLoan
- **Application Service**: LoanOriginationService (orchestrates Apply → Approve → Disburse)
- **Specifications**: ApplicationIsPending, LoanIsApproved

**DNA equivalent**: see [`examples/lending/operational.json`](../../examples/lending/operational.json):

- Bounded Context → `Domain` (`acme.finance.lending`)
- Aggregate roots → `Resource` (Loan, Borrower)
- Domain services → `Operation` (Loan.Apply, Loan.Approve, Loan.Disburse) — actor-agnostic, what the business *can* do
- Application service → `Process` (LoanOrigination) — DAG of Steps, each a Task
- Domain events → `Signal` (lending.Loan.Disbursed with typed payload)
- Specifications → named condition `Rule` (ApplicationIsPending, LoanIsApproved), referenced by Operation rules and Step.conditions

The DDD model's roles (Borrower, Underwriter, LendingManager) collapse into Resources alongside Loan and Borrower — DDD typically separates "business actors" from "tracked entities," DNA doesn't.

## Where the methodologies overlap practically

- **Event Storming → DNA authoring.** A successful Event Storming session produces sticky notes for events, commands, actors, and aggregates. Each maps directly: Event → Signal, Command → Operation, Actor → Resource (acting as Role), Aggregate → Resource. If your team runs Event Storming, the output is roughly an Operational DNA draft.
- **Bounded Context Canvas → DNA Domain + cross-domain Signals.** The canvas's "messages consumed/produced" become Signals consumed/emitted by Operations.
- **Strategic Design conversations** (core vs supporting vs generic) are best captured in the Domain `description` fields and in supplementary docs — DNA stays neutral on which Domains are core.

## See also

- [BPMN comparison](./bpmn.md) — for the Process/Step/Task overlap with workflow notation
- [Archimate comparison](./archimate.md) — for higher-altitude organizational modeling
