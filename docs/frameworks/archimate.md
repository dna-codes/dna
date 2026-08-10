# DNA ↔ ArchiMate

> **Canonical version: [dna.codes/docs/frameworks#archimate](https://dna.codes/docs/frameworks#archimate).** The site carries the reader-facing copy and governs where the two differ. This file is kept for repo and offline readers.

How DNA's operational layer maps to **ArchiMate 3** (The Open Group). ArchiMate is an enterprise-architecture modeling language spanning Business, Application, and Technology layers across active/behavior/passive concerns. DNA's three layers (Operational, Product, Technical) align loosely; this doc focuses on the Business layer overlap.

> **Note (post-reorg, 2026-04):** This doc was written before the People/Structures/Activities reorg. Some examples reference the old "Resources-used-as-Roles" structural-typing model. The current shape splits Person, Role, Group, and Membership into first-class primitives — see [`README.md`](../../README.md) and [`ROADMAP.md`](../../ROADMAP.md). The conceptual mappings below still hold; concrete syntax examples may be outdated.

> ArchiMate is broader than DNA — it models the whole enterprise architecture portfolio including motivation, strategy, and physical layers. DNA targets a system's description, not the enterprise. Where ArchiMate stops at "Business Service," DNA continues into the implementable specification.

## Concept-by-concept mapping (Business layer)

| ArchiMate concept | DNA equivalent | Notes |
|---|---|---|
| **Business Actor** (active structure) | `Resource` referenced as actor | An ArchiMate Business Actor is "an organizational entity capable of performing behavior" — in DNA, that's a Resource referenced from `Task.actor` or `Rule.allow[].role`. ArchiMate distinguishes Actor (org entity) from Role (named function); DNA collapses both into Resource-with-usage-semantics. |
| **Business Role** | `Resource` (used as Role) with optional `scope` | A named function that can be assigned to an Actor. In DNA, a Role is just a Resource referenced from `Memberships` or access Rules. The optional `scope` field on the Role-Resource captures the Group context (Underwriter.scope = BankDepartment). |
| **Business Collaboration** | A Group-Resource with Memberships from multiple Role-Resources | An ArchiMate collaboration is a temporary aggregate of Roles working together. In DNA, model the collaboration as a Resource (the Group), and pin the contributing Roles' Memberships to it. |
| **Business Interface** | Not modeled (Product layer concern) | ArchiMate's interface is the "channel" through which behavior is exposed. In DNA that's the Product API/UI layer (Endpoint, Page), not Operational. |
| **Location** | Not modeled (Technical layer concern) | Geography belongs in Technical (Provider regions, etc.), not in business description. |
| **Business Process** | `Process` (with `Step`s and `Task`s) | 1:1 conceptually. ArchiMate's process is a "sequence of business behaviors that achieves a specific outcome"; DNA's Process is the same with explicit `startStep` and step-level `conditions`. |
| **Business Function** | `Resource` + the set of `Operations` on it | ArchiMate distinguishes "function" (collected behavior owned by a unit) from "process" (sequenced behavior). DNA doesn't formally separate them — a Resource's Actions and the Operations grouped under it constitute its function. |
| **Business Interaction** | `Process` with multiple Tasks whose actors are different Roles | A behavior performed by a collaboration. In DNA, a Process whose Steps reference Tasks with different actors *is* the interaction. |
| **Business Service** | `Operation` (when externally observable) | A discrete, externally-meaningful unit of behavior. DNA's Operations are exactly this — `Resource.Action` pairs that are the atomic units a Process or external caller invokes. |
| **Business Event** | `Trigger` (initiation) + `Signal` (consequence) | ArchiMate's event is "something that happens (internally or externally) and influences behavior." DNA splits the modeling: a `Trigger` is "what initiates an Operation/Process"; a `Signal` is "what gets published when an Operation completes." Both have ArchiMate Event nature. |
| **Business Object** (passive structure) | `Resource` (with attributes) | A "concept used or produced by behavior." In DNA, every tracked entity is a Resource. ArchiMate Business Objects are a subset of DNA Resources (the ones not used as Actors or Groups). |
| **Contract** | `Signal` payload contract; `Rule` (access + condition) | ArchiMate Contracts formalize agreements between parties. DNA expresses contracts in two places: Signal payload schemas (for cross-domain message shapes) and Rules (for access and pre-condition agreements). |
| **Representation** (artifact) | Not modeled (Product layer if rendered) | A perceptible form of a Business Object — typically a UI rendering, which lives in Product UI's Page/Block primitives. |
| **Product** | `Resource` (the thing sold) + grouping `Domain` | ArchiMate Products bundle services for customers. DNA models the product as a Resource with associated Operations; bundles are a Domain-level concern (the `*.lending` domain *is* the lending product). |
| **Value** | Not formally modeled | The "what's worth providing" question is in DNA Resource/Operation `description` fields and supplementary motivation docs, not a primitive. |
| **Meaning** | `description` fields throughout DNA | ArchiMate's meaning is "the cultural interpretation"; DNA's prose `description` carries it. |

## Layer alignment

| ArchiMate layer | DNA layer |
|---|---|
| Motivation (stakeholders, drivers, goals) | Out of scope — supplementary docs |
| Strategy | Out of scope — supplementary docs |
| **Business** | **Operational** (this doc's focus) |
| **Application** | **Product** (Core, API, UI) |
| **Technology** | **Technical** (Cell, Construct, Provider, Environment) |
| Physical | Out of scope — Technical adapters handle physical realization |
| Implementation & Migration | Out of scope — your release process owns this |

The mapping is loose, not formal. DNA is a description; ArchiMate is a notation. They overlap in scope but optimize for different uses (DNA → executable code generation; ArchiMate → enterprise communication and analysis).

## Where DNA intentionally differs

1. **DNA collapses Actor and Role.** ArchiMate's distinction is useful for organizational modeling ("the person Alice plays the Underwriter role") but redundant in DNA — both are Resources, distinguished by usage.
2. **DNA has no Business Function vs Business Process distinction.** ArchiMate separates them by ownership (function = unit) vs sequence (process). DNA models Operations directly; Processes orchestrate them; the "function" emerges from grouping.
3. **DNA omits Motivation/Strategy primitives.** Goals, drivers, principles, requirements — important for enterprise architecture, out of scope for a code-description language. Document them in supplementary materials and link from `description` fields.
4. **DNA's Signal is not the same as Business Event.** ArchiMate Events are abstract "things that happen"; DNA Signals are concrete typed contracts published by an Operation. A Trigger (in DNA) is closer to ArchiMate's Event-as-initiator.
5. **DNA is implementable.** Every Operational primitive maps deterministically to a Product primitive and then a Technical primitive. ArchiMate models can describe what doesn't yet exist or won't be built — DNA is meant to generate working code.

## Concrete translation example

An ArchiMate Business-layer model for "Approve a Loan":

- **Business Actor**: Underwriter Department
- **Business Role**: Underwriter (assigned to actors in the department)
- **Business Process**: Loan Approval Process
- **Business Service**: Approve Loan (the externally-meaningful unit)
- **Business Event**: Loan Application Submitted (initiates the process)
- **Business Object**: Loan Application (passive structure)
- **Contract**: Loan Approval SLA (the agreement)

**DNA equivalent**: see [`examples/lending/operational.json`](../../examples/lending/operational.json):

- Business Actor → `Resource` (BankDepartment, the scoping Group)
- Business Role → `Resource` (Underwriter, with `scope: BankDepartment`)
- Business Process → `Process` (LoanOrigination)
- Business Service → `Operation` (Loan.Approve)
- Business Event (initiating) → `Trigger` (`process: LoanOrigination, source: webhook`)
- Business Object → `Resource` (Loan, with attributes)
- Contract → `Signal` (lending.Loan.Disbursed payload) + `Rule` (access, condition)

The Underwriter Department is a Group-Resource; concrete people would be User-Resources with `memberships: [{role: Underwriter, in: BankDepartment}]`.

## When to reach for which

- **Use ArchiMate** when communicating across the enterprise (motivation, strategy, multi-system landscape, stakeholder analysis).
- **Use DNA** when describing a system you intend to build, with rules tight enough to generate code, documentation, and workflows from.
- **Use both** by treating ArchiMate as the upstream architectural sketch and DNA as the downstream specification — the Business layer of an ArchiMate model is roughly the Operational layer of a DNA document.

## See also

- [BPMN comparison](./bpmn.md) — for the Process/Step/Task overlap with workflow notation
- [DDD comparison](./ddd.md) — closest to DNA in spirit; same code-description ambition
