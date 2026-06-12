# DNA Codes (@dna-codes)
DNA is a description language for business systems — your digital DNA. Once defined, it can be used to generate documentation, workflows, and robust software automatically.

A DSL written in JSON/YAML, it describes a business at three intentionally decoupled layers — what the business does, what gets built, and how it gets built — and provides tooling to validate those descriptions and render them as documentation.

Below is a visual that represents the general scope of DNA.

<img width="2700" height="1490" alt="image" src="https://github.com/user-attachments/assets/6e8fbacf-ff04-4bca-be89-8142f021bcf2" />

## Ecosystem

This repo is the single source of truth for the DNA language and all published tooling. It is organized into three tiers:

| Tier | Directory | Published as | What it is |
|---|---|---|---|
| **Packages** | `packages/` | `@dna-codes/dna-*` | The DNA language SDK — schemas, TypeScript bindings, React hooks, adapters, GraphQL server, MCP server. Language-agnostic, zero behavioral opinion. |
| **Engine** | `engine/` | `@dna-codes/cells*` | The framework and tools that read DNA and produce things — the `cba` CLI, cell engines (api, db, ui), and architecture viewer. |
| **Platform** | separate repos | not published | Deployed applications that consume the above (`dna-platform/`, `dna-codes-site/`, etc.). |

**Where does a new thing go?**
- New SDK package (language primitives, bindings, adapters) → `packages/`
- New tool or framework package (reads DNA, produces artifacts, ships a CLI) → `engine/`
- New deployed application → a separate platform repo

```
dna/                         ← this repo
  packages/
    schemas/                 @dna-codes/dna-schemas     JSON Schema spec
    core/                    @dna-codes/dna-core         TS bindings + validator
    react/                   @dna-codes/dna-react        React hooks
    ingest/                  @dna-codes/dna-ingest       multi-source orchestrator
    adapters/                @dna-codes/dna-adapters     input/output/integration
    api/                     @dna-codes/dna-api          GraphQL server
    mcp/                     @dna-codes/dna-mcp          MCP server (agent-first graph interface)
  engine/
    cba/                     @dna-codes/cells            CLI (cba binary)
    cba-viz/                 @dna-codes/cells-viz        architecture viewer
    cells-api/               @dna-codes/cells-api        DNA → API code cell
    cells-db/                @dna-codes/cells-db         DNA → DB schema cell
    cells-ui/                @dna-codes/cells-ui         DNA → UI components cell
    fixtures/                test fixture DNA documents
  apps/
    graph-studio/            dna-graph-studio            visual graph explorer (developer tool)
    dna-agent/               dna-agent                   agent-first UI for business leaders
  examples/                  reference DNA documents
```

## Contents

- [The Three Layers](#the-three-layers)
- [Cross-domain examples](#cross-domain-examples)
- [Framework comparisons](#framework-comparisons)
- [Concepts reference](#concepts-reference)
- [Operational Layer](#operational-layer)
- [Product Layer](#product-layer)
- [Technical Layer](#technical-layer)
- [Lenses](#lenses)
- [Packages](#packages)
  - [Pipeline](#pipeline)
  - [Naming convention](#naming-convention)
  - [Installing from npm](#installing-from-npm)
  - [Releasing](#releasing)
  - [Input coverage by layer](#input-coverage-by-layer)

## The Three Layers

| Layer | What it captures | Analogous to |
|-------|-----------------|--------------|
| **Operational** | What the business does — people, structures, rules, SOPs | Domain-Driven Design |
| **Product** | What gets built — resources, operations, endpoints, pages | OpenAPI + Atomic Design |
| **Technical** | How it gets built — cells, constructs, providers, environments | Terraform / AWS SAM |

Layers are one-way downstream: Operational → Product → Technical. Upper layers never depend on lower ones. Cross-layer references (e.g. a Product Resource pointing at an Operational Resource) are plain strings validated by `@dna-codes/dna-core` rather than JSON Schema `$ref`s.

Operational DNA is **organizational modeling** — the **nouns** an organization deals with (people, places, things) and the **verbs** that bind them. It's modeled around the **Actor > Action > Subject** triad: Roles act, Subjects (any noun primitive) receive actions. Operational primitives fall into three categories — **People** (Person, Role, Group, Membership), **Structures** (Resource, Attribute, Relationship), and **Activities** (Operation, Task, Step, Process, Trigger, Rule). An **Operation** is always a `Target.Action` pair where Target is any noun primitive.

Here's a minimal Operational DNA document in a lending context:

```json
{
  "domain": {
    "name": "lending",
    "path": "acme.finance.lending",
    "resources": [
      {
        "name": "Loan",
        "attributes": [
          { "name": "amount", "type": "number", "required": true },
          { "name": "status", "type": "enum", "values": ["pending", "active", "repaid"] }
        ],
        "actions": [
          { "name": "Apply",   "type": "write" },
          { "name": "Approve", "type": "write" }
        ]
      }
    ],
    "persons": [
      { "name": "Borrower" },
      { "name": "Employee" }
    ],
    "groups": [
      { "name": "BankDepartment" }
    ],
    "roles": [
      { "name": "Underwriter", "scope": "BankDepartment" }
    ]
  },
  "memberships": [
    { "name": "EmployeeUnderwriter", "person": "Employee", "role": "Underwriter" }
  ],
  "operations": [
    { "target": "Loan", "action": "Apply",   "name": "Loan.Apply",   "changes": [{ "attribute": "status", "set": "pending" }] },
    { "target": "Loan", "action": "Approve", "name": "Loan.Approve", "changes": [{ "attribute": "status", "set": "active" }] }
  ],
  "triggers": [
    { "operation": "Loan.Apply",   "source": "user" },
    { "operation": "Loan.Approve", "source": "user" }
  ],
  "rules": [
    { "operation": "Loan.Apply",   "type": "access", "allow": [{ "role": "Borrower" }] },
    { "operation": "Loan.Approve", "type": "access", "allow": [{ "role": "Underwriter" }] },
    { "operation": "Loan.Approve", "type": "condition", "conditions": [{ "attribute": "loan.status", "operator": "eq", "value": "pending" }] }
  ]
}
```

## Cross-domain examples

Canonical end-to-end DNA documents demonstrating the model across different business domains. Each one validates against the schemas under `@dna-codes/dna-core` and exercises specific parts of the model — start here when you want to see how a real domain looks.

| Example | Demonstrates |
|---|---|
| [`examples/lending`](./examples/lending) | Operations, Tasks, Process; Operation-level + Process-level Triggers; system Role (scheduled job); scoped Role; Person-as-actor (Borrower) + Role-as-actor (Underwriter); Memberships |
| [`examples/mass-tort`](./examples/mass-tort) | Case as Group; multiple Person→Role Memberships (Partner→LeadCounsel/CoCounsel); multiple Processes; Process triggered by Operation completion |
| [`examples/marketplace`](./examples/marketplace) | Same Person template eligible for two peer Roles via Memberships (Member→Host AND Member→Guest); two Groups (Listing, Booking); global (unscoped) Role; Step.else routing |
| [`examples/healthcare`](./examples/healthcare) | Patient as Person template (structure + lifecycle); per-Person Role.scope (AttendingPhysician.scope = Patient); mixed scope targets (Person + Group); multi-predicate condition Rule |
| [`examples/manufacturing`](./examples/manufacturing) | Multiple system Roles (CNC, press, paint robot, scheduler) with `system: true` and `resource:` link; parallel fan-out + fan-in via Step.depends_on; schedule-source Trigger on a system Operation |
| [`examples/education`](./examples/education) | Course (Resource catalog) vs CourseOffering (Group); two Person templates eligible for distinct Roles (Faculty→Instructor, UniversityMember→Student); three scope tiers; calendar-aligned schedule Triggers |
| [`examples/registry`](./examples/registry) | Type-driven platform meta-pattern; TypeDefinition / Instance / Link triad; `category` enum dispatching condition Rules (`TypeIsNotRole`, `TypeIsPublished`); system Role on a Resource template (`ValidationEngine`); Process-level Trigger off a config-primitive lifecycle Operation (`InstanceBootstrap` after `TypeDefinition.Publish`) |

## Framework comparisons

If you already model your domain in DDD, BPMN, ArchiMate, C4, Event Storming, or run a TOGAF practice, see [`docs/frameworks/`](./docs/frameworks) for concept-by-concept mappings, where DNA intentionally differs, and concrete translations using the examples above. Currently covered: [BPMN](./docs/frameworks/bpmn.md), [Domain-Driven Design](./docs/frameworks/ddd.md), [ArchiMate](./docs/frameworks/archimate.md), [C4 Model](./docs/frameworks/c4.md), [Event Storming](./docs/frameworks/event-storming.md), [TOGAF](./docs/frameworks/togaf.md).

## Concepts reference

A conceptual reference for DNA's metamodel lives in [`docs/concepts/`](./docs/concepts) — the three Layers, the catalog of types with their relationships, perspectives for navigating the graph, and machine-readable schema (`lenses.json`) intended for adapters like `integration/neo4j`. The concepts docs are deliberately abstract (DNA as a graph) and may use names that differ from the DSL primitives documented below; reconciliation is an open thread.

## Operational Layer

Operational DNA captures organizational modeling — what an organization *is* and what it *does*, independent of UI, API, or deployment technology. Three categories of primitives:

- **People** — Person, Role, Group, Membership
- **Structures** — Resource, Attribute, Relationship
- **Activities** — Operation, Task, Step, Process, Trigger, Rule

`Domain` wraps the four noun primitives (Resources, Persons, Roles, Groups) into bounded contexts; `Memberships` and Activities live at the document top level.

**People primitives:**
- **Person** — an individual template (`Customer`, `Employee`, `Patient`, `Borrower`). The kind of human the org deals with — not a specific named individual (instance-level data lives in Product/Technical layers). Has attributes and optional actions.
- **Role** — a position/capacity template (`Underwriter`, `Doctor`, `LeadCounsel`, `SuperAdmin`). May declare `scope` (the Group or Person the Role is exercised within), optional `system: true` for non-human actors, optional `resource:` link when a system Role is backed by a Resource template, optional `actions[]` for org-admin lifecycle (e.g. `Underwriter.Activate`), and optional per-scope-instance constraints `cardinality` (`one`/`many`), `required` (presence), and `excludes` (mutual-exclusion with other Roles on the same scope instance).
- **Group** — a work-unit / container template (`BankDepartment`, `Hospital`, `Case`, `Workspace`, `Family`). Has attributes and lifecycle; primarily exists to scope Roles.
- **Membership** — a template-level eligibility statement: "Persons of type X may hold Roles of type Y, optionally in Groups of type Z." Captures organizational RBAC at the type level — *not* per-instance bindings.

**Structure primitives:**
- **Resource** — a structure template the org manages (`Loan`, `Invoice`, `Account`, `Document`). Has attributes, actions, and optional parent.
- **Attribute** — a typed property on any noun primitive; types: `string`, `text`, `number`, `boolean`, `date`, `datetime`, `enum`, `reference`.
- **Relationship** — a named, directed, typed connection between any two noun primitives (cardinality + reference attribute).

**Shared noun shape:** Resource, Person, Role, and Group all support `name`, `attributes[]`, `actions[]`, and optional `parent`. Each `actions[]` entry is an object with `name`, optional `description`, `type` (`read | write | destructive`), and `idempotent`.

**Activity primitives:**
- **Operation** — a `Target.Action` pair where Target is any noun primitive; the atomic unit of business activity (`Loan.Approve`, `Patient.GetAdmitted`, `Underwriter.Activate`, `Case.Settle`). The validator resolves `target` across all four noun collections. Optional `changes[]` declares the state mutations the Operation applies to its target Resource (the only place state-mutation modeling lives — there is no separate Outcome primitive).
- **Trigger** — what initiates an Operation or a Process. Sources: `user`, `schedule`, `webhook`, `operation`. A Trigger targets exactly one of: an Operation (ad-hoc invocation) or a Process (kick off the whole SOP from `startStep`). Operation-to-Operation chaining is expressed via `source: "operation"` + `after`.
- **Rule** — constraints on an Operation: `access` (which Roles or Persons may perform it) or `condition` (what must be true first). Condition Rules are also referenced from `Step.conditions[]` for compositional gating — the only mechanism for entry/intra-Process gating.
- **Task** — a `(actor, operation)` binding. Actor is a Role (internal positions like Underwriter) OR a Person (external actors like Borrower). The standalone equivalent of an orchestrated Step — Tasks describe SOP atoms outside any Process.
- **Process** — a Standard Operating Procedure: a named DAG of **Steps** with an explicit `startStep` (Amazon-States-Language convention). Each Step references exactly one Task and adds orchestration metadata (`depends_on`, `conditions`, `else`); Steps are inline sub-primitives of Process — they have no top-level schema and are meaningful only inside `Process.steps[]`.

**Memberships are template-level, not instances:**

```json
{ "name": "EmployeeUnderwriter", "person": "Employee", "role": "Underwriter" }
{ "name": "PartnerLeadCounsel",  "person": "Partner",  "role": "LeadCounsel" }
{ "name": "EmployeeAdmin",       "person": "Employee", "role": "SuperAdmin", "group": "Workspace" }
```

These say *what kinds of people can hold what kinds of roles in what kinds of groups* — not "Joe is the Underwriter of Eastern Branch." Specific person × role × group bindings (auth records, identity tokens) belong at the Product/Technical layer.

## Product Layer

Product DNA describes what gets built. It is split into three sub-layers that can be authored independently.

**Core** (`product.core.json`) — materializes Operational concepts into product primitives: `Resource`, `Action`, `Operation`, `Field`, `User`, `Role`. Product `Resource` and `Action` are surface projections of their Operational counterparts — the same vocabulary is reused intentionally. The People primitives now project too: **`User`** is the product-layer projection of Operational `Person` *and* the identity/login subject for auth, and **`Role`** is the projection of Operational `Role` *and* the RBAC role read by product/api auth middleware and product/ui permission guards. `User.identity` (which field authenticates the subject) is a configured product fact; `Role.permissions[]` is a derived rollup of the Operational access Rules that name the role — not an authored ACL. (Group and Membership projection remains open — see `ROADMAP.md`.)

Every primitive in every layer may carry an optional `stability` maturity marker (`experimental` / `beta` / `stable` / `deprecated`), declared once in the shared `meta/stability` schema and composed via `allOf`; e.g. Product Core `Field` declares `experimental`. This is orthogonal to schema version and aligns with the registry's `stability` lifecycle — see [Stability lifecycle](./docs/concepts/resource-types.md#stability-lifecycle).

**API** (`product.api.json`) — REST surface: `Endpoint`, `Namespace`, `Param`, `Schema`

**UI** (`product.ui.json`) — web surface: `Layout`, `Page`, `Route`, `Block`

## Technical Layer

Technical DNA (`technical.json`) describes how the system is deployed and wired together.

Primitives: `Cell`, `Construct`, `Environment`, `Node`, `Connection`, `Zone`, `Provider`, `Variable`, `Output`, `Script`, `View`

A **Cell** is the unit of deployment — it consumes DNA from upper layers and generates concrete artifacts (API code, database migrations, infrastructure templates).

## Lenses

A **Lens** is the third DNA metamodel concept — a named graph pattern of typed node slots and directed edges that governs both directions of graph use:

- **Query direction** — find all subgraphs in the DNA graph matching this pattern
- **Command direction** — assert a specific binding of this pattern into the graph

Both directions use the same Lens definition. Three structural kinds all use the same format:

| Kind | Edges | Example |
|------|-------|---------|
| **Layer** | 0 | `operational` — groups all operational resource types |
| **Traversal** | 1 | `people` — Person → Group |
| **Subgraph** | ≥2 | `access-control` — User → Role → Domain / Operation → Resource |

Core lenses ship in `@dna-codes/dna-lenses` and are registered in `@dna-codes/dna-core`:

```typescript
import { lenses, allLenses } from '@dna-codes/dna-core'

lenses.accessControl  // { $id, name, nodes[], edges[], sentence }
allLenses()           // all six lens definitions as a flat array
```

The lens definitions live in `packages/core/lenses/` and are available via `@dna-codes/dna-core`. See [`packages/core/README.md`](./packages/core/README.md#lenses--core-lens-definitions) for the full LensType format and the six core lens definitions.

## Packages

### Pipeline

The pipeline is `[integration] → input → DNA → output → [integration]`. Adapters live as subpaths under `@dna-codes/dna-adapters` (`@dna-codes/dna-adapters/input/<name>`, `.../output/<name>`, `.../integration/<name>`). When more than one source contributes to a single DNA, `dna-ingest` fans many `(integration → input → partial DNA)` paths into one canonical DNA via `dna-core.merge()`:

```
                    +------------------ @dna-codes/dna-ingest [*] ------------------+
                    |                                                                |
  gdrive://abc   -->|  adapters/integration/google-drive  -->  adapters/input/text -\
                    |                                                                \
  notion://page  -->|  adapters/integration/notion        -->  adapters/input/text --+--> merge()
                    |                                                                /       |
  file:///sop.md -->|  [built-in fs fetcher]              -->  adapters/input/text -/        |
                    |                  [1]                              [2]                  |
                    +-------------------------------------------------------------- | -------+
                                                                                    v
                                                                              +-------+    +---------------------+    +-------------------------+
                                                                              |  DNA  | -> | adapters/output/<x> | -> | adapters/integration/<x> |
                                                                              |  [3]  |    |        [4]          |    |     (writer)  [5]        |
                                                                              +-------+    +---------------------+    +-------------------------+

  [1]  Pure I/O reader. integration.fetch(uri) → raw bytes + mimeType. Owns auth, rate limits.
  [2]  Parses a format into DNA. Deterministic (JSON, OpenAPI, DDL) or probabilistic and LLM-backed (prose, transcripts, images).
  [3]  Canonical form. Three layers (operational -> product -> technical), validated by @dna-codes/dna-core.
  [4]  Renders DNA into a format. Pure, no I/O (markdown, Mermaid, HTML).
  [5]  Pure I/O writer. integration.write(target, {contents, mimeType}) — caller composes [4]→[5]. No DNA in the integration.
  [*]  dna-ingest is a thin orchestrator: URI scheme dispatches to integrations, MIME type dispatches to input
       adapters, per-source DNA chunks are merged into one via dna-core.merge() with conflict + provenance reporting.

  Each adapter is a subpath inside @dna-codes/dna-adapters (one published package, one version line).
  Single-source flows (no merge needed) skip dna-ingest and call the input subpath directly — both shapes are valid.
```

#### `Integration` contract for participating in `dna-ingest`

Every `integration-*` that wants to participate in multi-source ingest implements the `Integration` interface published from `@dna-codes/dna-ingest`. `fetch` is required (read path); `write` is optional (write path — only bidirectional integrations implement it):

```ts
interface Integration {
  fetch(uri: string): Promise<{
    contents: string | Buffer
    mimeType: string
    source: { uri: string; loadedAt: string /* ISO 8601 */ }
  }>
  write?(target: string, payload: { contents: string | Buffer; mimeType: string }): Promise<{
    target: string
    meta?: Record<string, unknown>
  }>
}
```

PDF/Office text extraction is the integration's responsibility — return already-normalized text or bytes, plus a sensible MIME type. The orchestrator routes by MIME glob into the matching `input-*` adapter. See [`packages/ingest/AGENTS.md`](packages/ingest/AGENTS.md) for the full guidance.

**Integrations are pure I/O.** They MUST NOT take or return DNA shapes on their library API. Composition (Epic prose → input-text → DNA → output-text → Stories) lives in caller code or in an integration's CLI — never inside the integration itself. See [`packages/integration-jira/src/cli.ts`](packages/integration-jira/src/cli.ts) for the canonical composition example.

### Naming convention
Pre-1.0, every adapter ships as a subpath inside `@dna-codes/dna-adapters` rather than as a standalone npm package. Each adapter folder under `packages/adapters/src/{input,output,integration}/<name>/` is self-contained and mechanically extractable into its own published package post-1.0.

- **`input/<name>`** — converts a format into DNA. Same input always produces same output (deterministic), unless the package requires an LLM, in which case it is probabilistic. Each probabilistic adapter documents its dependencies explicitly: required LLM provider, expected API keys, and non-determinism implications.
- **`output/<name>`** — renders DNA into a format string. No system knowledge; pure and local.
- **`integration/<name>`** — connects to an external system bidirectionally via `Integration.fetch` (read) and optional `Integration.write` (write). Owns auth, rate limits, and API versioning for that system. **Pure I/O** — no DNA-aware methods on the library API; composition with input/output adapters lives in the caller or the integration's CLI.

Full API reference and layer-specific authoring DNA contracts live in [`@dna-codes/dna-core/docs/`](packages/core/docs/).

### Installing from npm

Packages are published publicly to [npmjs.com](https://www.npmjs.com/org/dna-codes) under the `@dna-codes` scope. No `.npmrc`, no auth token, no setup:

```sh
npm install @dna-codes/dna-core
```

> **Heads up — stale `.npmrc` from the `0.4.x` line:** if you previously installed `@dna-codes/*` from GitHub Packages, your `~/.npmrc` may still contain `@dna-codes:registry=https://npm.pkg.github.com` and a matching `_authToken` line. Remove both — otherwise installs keep resolving against the deprecated GitHub Packages mirror and won't see new versions.

Quick verification (no `.npmrc` required):

```sh
npm view @dna-codes/dna-core version
```

### Releasing

Releases are tag-driven. From `main`, after bumping versions:

```sh
git tag v0.6.0
git push --tags
```

The push triggers `.github/workflows/publish.yml`, which builds every workspace and runs `npm publish` per workspace against `registry.npmjs.org`. Authentication uses the repo secret `NPM_TOKEN` (an npm **automation token** with publish access on the `@dna-codes` scope) — set it once via `gh secret set NPM_TOKEN`. The workflow can also be re-run manually from the Actions tab via `workflow_dispatch`.

### Input coverage by layer

Each input adapter has an authoritative scope — OpenAPI honestly knows about APIs, not deployment; a JSON sample knows about structures, not rules. That narrowness is a feature: it keeps deterministic adapters from inventing. `input/text` is the catch-all LLM path that can reach any layer.

| Layer | Deterministic source(s) | Probabilistic source(s) | Status |
|---|---|---|---|
| **Operational** | `input/json` ✅ · `input/ddl` 🚧 | `input/text` ✅ | **Covered** |
| **Product Core** | `input/prisma` 💡 | `input/text` ✅ | Probabilistic only |
| **Product API** | `input/openapi` ✅ | `input/text` ✅ | **Covered** |
| **Product UI** | `input/figma` 💡 · `input/nextjs-routes` 💡 | `input/text` ✅ | Probabilistic only |
| **Technical** | `input/terraform` 💡 · `input/cdk` 💡 | `input/text` ✅ | Probabilistic only |

Probabilistic-only layers rely on LLM inference from prose; they're the weakest link in the pipeline and the highest-leverage targets for new deterministic adapters.

Legend: ✅ shipped · 🚧 planned (listed below) · 💡 candidate (natural fit, not yet committed)

### Apps

| App | Purpose |
|---|---|
| [`apps/graph-studio`](./apps/graph-studio) | Full-stack Next.js 16 app — visual lenses into Neo4j-backed DNA graphs. First lens: Org Chart (domain → group → role → person containment + membership edges). JointJS+ for rendering, XState v5 for navigation and canvas interaction state. See [apps/graph-studio/README.md](./apps/graph-studio/README.md). |

### Packages (`packages/`)

Six SDK packages — the DNA language layer:

| Package | Purpose |
|---|---|
| [`@dna-codes/dna-schemas`](./packages/schemas) | Canonical JSON Schema (Draft 2020-12) definitions for all three layers — language-agnostic, zero deps |
| [`@dna-codes/dna-core`](./packages/core) | TypeScript bindings + per-layer and cross-layer validator; wraps `@dna-codes/dna-schemas`. Ships the core lens definitions (`lenses/`) and exports `lenses` / `allLenses()`. Also home to shared adapter contracts and the `DnaDataStore` runtime-data contract |
| [`@dna-codes/dna-react`](./packages/react) | React bindings — `DnaProvider`, `<Operation>` gate, and `useOperation` hook for authorization, audit capture, and feature flag integration driven by operational DNA |
| [`@dna-codes/dna-ingest`](./packages/ingest) | Multi-source DNA orchestrator. Fans `[source URI] → integration → input → partial DNA` per source, merges via `dna-core.merge()`, reports conflicts + provenance + non-fatal errors. Imports zero adapters — caller injects them. Defines the `Integration` and `InputAdapter` ports. |
| [`@dna-codes/dna-adapters`](./packages/adapters) | Unified adapter package — every input parser, output renderer, and integration client lives as a subpath. One version line, one publish per release. |
| [`@dna-codes/dna-api`](./packages/api) | Registry-native GraphQL API server. Seeds `ResourceType` / `RelationshipType` records from a DNA on first boot; admins author the type system at runtime through the API. Schema regenerates and hot-swaps on type mutations. Backed by `integration/neo4j` with versioned history. Each type carries a `stability` lifecycle marker (`experimental` / `beta` / `stable` / `deprecated`), orthogonal to its schema version — see [Stability lifecycle](./docs/concepts/resource-types.md#stability-lifecycle). |

### Engine (`engine/`)

Five framework and tooling packages — the cell-based architecture layer:

| Package | Purpose |
|---|---|
| [`@dna-codes/cells`](./engine/cba) | Unified CLI (`cba` binary) for the full cell-based architecture lifecycle: discover, design, develop, deliver |
| [`@dna-codes/cells-viz`](./engine/cba-viz) | Interactive architecture viewer — Vite + React + JointJS |
| [`@dna-codes/cells-api`](./engine/cells-api) | DNA → REST/GraphQL API code cell |
| [`@dna-codes/cells-db`](./engine/cells-db) | DNA → database schema / migrations cell |
| [`@dna-codes/cells-ui`](./engine/cells-ui) | DNA → UI components / pages cell |

#### Adapters (subpaths of `@dna-codes/dna-adapters`)

```sh
npm install @dna-codes/dna-adapters
# Then import the specific subpath:
import { parse } from '@dna-codes/dna-adapters/input/json'
import { render } from '@dna-codes/dna-adapters/output/markdown'
import { createClient } from '@dna-codes/dna-adapters/integration/jira'
```

| Subpath | Kind | Purpose |
|---|---|---|
| [`input/json`](./packages/adapters/src/input/json) | input · deterministic | Infers Resources, Attributes, and Relationships from a plain JSON data sample |
| [`input/openapi`](./packages/adapters/src/input/openapi) | input · deterministic | Parses an OpenAPI 3.x spec into a DNA Product API document |
| `input/ddl` 🚧 | input · deterministic | Parses SQL DDL into DNA Resources and Attributes |
| [`input/text`](./packages/adapters/src/input/text) | input · probabilistic | Converts freeform prose into DNA via an LLM provider |
| `input/transcript` 💡 | input · probabilistic | Converts a meeting or interview transcript into DNA |
| `input/image` 💡 | input · probabilistic | Infers DNA from an image (screenshot, whiteboard, diagram) |
| [`output/markdown`](./packages/adapters/src/output/markdown) | output | Renders DNA as structured markdown documentation |
| [`output/mermaid`](./packages/adapters/src/output/mermaid) | output | Renders DNA as Mermaid diagrams (ERDs, flowcharts) |
| [`output/html`](./packages/adapters/src/output/html) | output | Renders DNA as semantic HTML |
| [`output/openapi`](./packages/adapters/src/output/openapi) | output | Renders a Product API DNA as an OpenAPI 3.1 spec (YAML or JSON) |
| [`output/text`](./packages/adapters/src/output/text) | output | Renders DNA as plain prose — one combined document or one per unit |
| [`integration/jira`](./packages/adapters/src/integration/jira) | integration | Pure-I/O Jira Cloud client. Implements `Integration.fetch` and `Integration.write`. Composition example in [`cli.ts`](./packages/adapters/src/integration/jira/cli.ts). |
| `integration/github` 💡 | integration | Read/write DNA via GitHub Issues and Projects |
| `integration/notion` 💡 | integration | Read/write DNA via Notion pages and databases |
| [`integration/google-drive`](./packages/adapters/src/integration/google-drive) | integration | 🚧 Stub. Implements `Integration` contract; serves an in-memory mock map; throws `NotImplementedError` for real Drive fetches until a follow-up change wires auth + the Drive API. |
| [`integration/neo4j`](./packages/adapters/src/integration/neo4j) | integration | Runtime-data store. Persists the *data described by* a DNA into Neo4j using the registry triad (TypeDefinition / Instance / Link). DNA-aware exception to the pure-I/O rule — see [AGENTS.md](./packages/adapters/src/integration/neo4j/AGENTS.md). |
| [`integration/memory`](./packages/adapters/src/integration/memory) | integration | Zero-dep in-memory implementation of the same `DnaDataStore` contract as `integration/neo4j`. Recommended test double for any consumer of `DnaDataStore`. |
| [`input/example`](./packages/adapters/src/input/example) | template | Template for a new input adapter — shows deterministic and probabilistic modes side-by-side |
| [`output/example`](./packages/adapters/src/output/example) | template | Template for a new output renderer with a sections pattern |
| [`integration/example`](./packages/adapters/src/integration/example) | template | Template for a new integration — outbound API, inbound webhook (HMAC), and a CLI |

Each adapter folder is self-contained and mechanically extractable into its own published package post-1.0 (file moves + a new `package.json`, no source-file edits).

See the root [`AGENTS.md`](AGENTS.md) for overall repo orientation.
