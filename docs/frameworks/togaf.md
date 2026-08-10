# DNA ↔ TOGAF

> **Canonical version: [dna.codes/docs/frameworks#togaf](https://dna.codes/docs/frameworks#togaf).** The site carries the reader-facing copy and governs where the two differ. This file is kept for repo and offline readers.

How DNA relates to **TOGAF** (The Open Group Architecture Framework, currently 10th edition). Unlike the [BPMN](./bpmn.md), [DDD](./ddd.md), and [Event Storming](./event-storming.md) docs in this folder, this isn't a notation comparison — TOGAF is a **method** for doing enterprise architecture, not a modeling language. DNA is one kind of artifact a TOGAF practice would produce in the Business / Information Systems Architecture phases.

> **Note (post-reorg, 2026-04):** This doc was written before the People/Structures/Activities reorg. Some examples reference the old "Resources-used-as-Roles" structural-typing model. The current shape splits Person, Role, Group, and Membership into first-class primitives — see [`README.md`](../../README.md) and [`ROADMAP.md`](../../ROADMAP.md). The conceptual mappings below still hold; concrete syntax examples may be outdated.

> Treat this doc as positioning, not translation. There's no concept-by-concept mapping because TOGAF concepts are mostly about *process and governance*, while DNA concepts are about *what gets described*. The two are complementary, not competing.

## Where DNA fits in TOGAF

TOGAF's central artifact is the **Architecture Development Method (ADM)** — eight phases (A–H) plus a Preliminary phase and Requirements Management at the center. DNA is most useful in three phases:

| ADM Phase | DNA's role |
|---|---|
| **Preliminary** | Establish that DNA will be the canonical description format for in-flight architectures. Tooling choice, repository conventions. |
| **A. Architecture Vision** | Out of scope. Vision documents are prose + ArchiMate sketches; DNA isn't designed for high-altitude vision communication. |
| **B. Business Architecture** | DNA `Operational` documents are the deliverable — Resources, Operations, Roles, Processes. Replaces or complements TOGAF's Business Architecture deliverables (Business Capability Map, Business Process diagrams, Organization/Actor catalog). |
| **C. Information Systems Architecture — Data** | DNA Operational `Resource` + `Attribute` + `Relationship` cover the Data Architecture's logical model. ER-style diagrams are renderable from this (see `@dna-codes/dna-adapters/output/mermaid` ERD diagram). |
| **C. Information Systems Architecture — Application** | DNA `Product` documents (`product.core.json`, `product.api.json`, `product.ui.json`) describe what gets built. Replaces application-component catalogs, application-service-vs-component mappings, and most surface-level interface specs. |
| **D. Technology Architecture** | DNA `Technical` documents (`technical.json` — Cells, Constructs, Providers, Environments) describe deployment and infrastructure. Replaces platform decomposition diagrams and technology standards catalogs. |
| **E. Opportunities & Solutions** | Out of scope — gap analysis and solution sequencing are workshop activities, not artifacts DNA captures. |
| **F. Migration Planning** | Out of scope — change-management and roadmap concerns. |
| **G. Implementation Governance** | DNA validation (`@dna-codes/dna-core`) provides part of the conformance check — generated code matches the architecture by construction. Doesn't replace governance reviews. |
| **H. Architecture Change Management** | Out of scope. DNA documents live in git; change management is your release process. |

**The short version**: DNA is what you produce in Phases B, C, and D. The rest of ADM (vision, gap analysis, governance, change) sits around DNA, not inside it.

## Architecture domains

TOGAF organizes Phase B/C/D content into four **architecture domains**, which align cleanly with DNA's three layers:

| TOGAF domain | DNA layer | Notes |
|---|---|---|
| **Business Architecture** | Operational | 1:1. Both describe what the business does — Resources (entities + actors + groups), Operations, Rules, Processes, Signals. |
| **Data Architecture** | Operational `Resource` + `Attribute` + `Relationship` | The data model is part of Operational in DNA, not a separate layer — domain entities ARE the data architecture. |
| **Application Architecture** | Product (Core, API, UI) | DNA's Product layer is the application architecture — Resource projections, Operations as API endpoints, UI Pages. |
| **Technology Architecture** | Technical | Deployment/infrastructure — Cells, Constructs, Providers, Environments. |

DNA collapses TOGAF's Business + Data into one layer (Operational) on the principle that domain entities and business behaviors are inseparable. TOGAF separates them for staffing and governance reasons (different deliverable owners), which DNA leaves to the org.

## Building Blocks

TOGAF distinguishes:

- **Architecture Building Blocks (ABB)** — abstract, reusable architectural concepts.
- **Solution Building Blocks (SBB)** — concrete implementations.

DNA's primitives are mostly **ABB-shaped** at the Operational + Product Core layers and **SBB-shaped** at the Product API/UI + Technical layers. A `Resource` is an ABB; a `Cell` consuming a specific adapter against a specific cloud provider is an SBB.

| TOGAF building block | DNA primitive |
|---|---|
| Business Service ABB | `Operation` |
| Data Entity ABB | `Resource` |
| Application Service ABB | `Operation` (Product Core) |
| Application Component SBB | `Cell` (Technical, when materialized) |
| Technology Component SBB | `Construct` |
| Logical Application Component | A `Cell` declaration before adapter binding |
| Physical Application Component | A `Cell` after adapter binding (`adapter.type` set) |

## Architecture Content Framework deliverables

TOGAF's **Architecture Content Framework** lists ~30 standard deliverables. The ones DNA replaces or generates from:

| TOGAF deliverable | DNA equivalent |
|---|---|
| Business Capability Map | List of `Operation`s grouped by `Resource` (the rough equivalent — DNA Operations are finer-grained than TOGAF Capabilities; see [BPMN doc](./bpmn.md) for why "capability" was renamed) |
| Organization/Actor Catalog | Resources used as Roles, plus Memberships pinning Users to Groups |
| Business Service / Function Catalog | `Operation` list, scoped by `Domain` |
| Business Process Diagrams | `Process` documents; render via `@dna-codes/dna-adapters/output/mermaid` flowchart |
| Data Entity / Data Component Catalog | `Resource` list with `Attribute`s |
| Logical / Physical Data Model | `Resource` + `Attribute` + `Relationship` (ERD via `@dna-codes/dna-adapters/output/mermaid`) |
| Application Communication Diagram | Cross-`Domain` Operation chains via `Trigger` (`source: operation`) |
| Application & User Location Diagram | Out of scope (Technical layer's `Provider.region` is closest, but DNA doesn't track user geography) |
| Application/Function Matrix | Implicit from `Operation` × `Resource` pairings |
| Technology Standards Catalog | `Provider` declarations + `Construct` types |
| Technology Portfolio Catalog | `Cell` list across all `Environment`s |
| Networked Computing/Hardware Diagram | Out of scope (handled by `Provider`-level cell adapter outputs) |
| Architecture Requirements Specification | Out of scope — requirements live in your tracker (Jira/Linear), referenced from prose |
| Architecture Roadmap | Out of scope — DNA documents *current* and *target* states; sequencing is your release plan |

## Where DNA exceeds TOGAF for a given system

- **Executable specification.** TOGAF deliverables describe what *should* exist; DNA describes what *will* exist and is the input to code generation. The architecture and the implementation can't drift because the implementation is generated from the architecture.
- **Cross-layer enforcement.** TOGAF treats Phase B/C/D deliverables as separate documents; DNA enforces that a Product Resource references an Operational Resource, an API Endpoint references a real Operation, and so on. Cross-layer validation at the document level.
- **Tighter actor model.** TOGAF Actor/Role is loose. DNA's Memberships (User × Role × Group) and `Role.scope` capture authorization-shaped invariants TOGAF doesn't formalize.

## Where TOGAF exceeds DNA

- **Governance, change management, capability management.** TOGAF's value is largely in Phases A, E, F, G, H — vision, gap analysis, migration planning, governance reviews, change management. None of these are DNA's job; DNA presupposes you know what you're describing.
- **Multi-system landscape.** TOGAF's Architecture Continuum and Enterprise Continuum classify reusable assets across many systems. DNA describes individual systems' bounded contexts; the cross-system asset library lives outside DNA (or as a registry of DNA documents).
- **Stakeholder + requirements management.** Phase A's stakeholder analysis and Requirements Management at ADM's center are workshop and tracker disciplines, not artifact shapes.
- **Skills and capability frameworks.** TOGAF Architecture Capability Framework covers org maturity, EA team skills, governance bodies. Out of scope for DNA entirely.

## Recommended workflow

1. **Run TOGAF as you do.** ADM phases stay the same; deliverable lists stay the same.
2. **Replace specific Phase B/C/D deliverables with DNA documents.** Business Capability Map → Operation list grouped by Resource; Data Entity Catalog → Resource list; Application Communication Diagram → cross-domain Signals; Technology Portfolio Catalog → Cell list. Render TOGAF-style views from the DNA where stakeholders need them (`@dna-codes/dna-adapters/output/mermaid` for diagrams, `@dna-codes/dna-adapters/output/markdown` for catalogs).
3. **Keep TOGAF's vision, gap, migration, governance, and change-management practices intact.** DNA doesn't try to replace them.
4. **Use DNA validation as part of Phase G.** Cross-layer validation catches "the spec doesn't match the implementation" — one less governance review.

## Concrete deliverable swap example

A typical TOGAF Business Architecture deliverable bundle for the Lending domain:

- Business Capability Map (loan origination, underwriting, servicing, collections)
- Organization/Actor Catalog (Borrower, Underwriter, Lending Manager, Collections Agent)
- Business Process Diagrams (Loan Origination Process, Default Process)
- Business Information Model (Loan, Borrower, Account, Payment entities)

**DNA equivalent** for the same scope: [`examples/lending/operational.json`](../../examples/lending/operational.json). One file replaces all four deliverables, validates, generates per-stakeholder views (markdown catalog, mermaid flowchart, mermaid ERD), and serves as the source of truth for code generation downstream.

The DNA file isn't laid out the way a TOGAF document would be — it's structured by primitive type, not by "deliverable" — but every concept the TOGAF deliverables would carry is in there, and each is referenced from the others by name with cross-layer validation enforcing consistency.

## See also

- [ArchiMate](./archimate.md) — TOGAF's companion notation; the closest cousin to DNA's vocabulary
- [BPMN](./bpmn.md) — for Business Process Diagram replacement
- [DDD](./ddd.md) — closest in spirit; treats domain modeling as an executable activity rather than an EA deliverable
- [C4](./c4.md) — alternate framing for Application + Technology Architecture
