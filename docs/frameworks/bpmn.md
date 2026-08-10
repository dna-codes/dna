# DNA ↔ BPMN

> **Canonical version: [dna.codes/docs/frameworks#bpmn](https://dna.codes/docs/frameworks#bpmn).** The site carries the reader-facing copy and governs where the two differ. This file is kept for repo and offline readers.

How DNA's operational layer maps to **BPMN 2.0** (Business Process Model and Notation, OMG). BPMN is a graphical process-modeling notation; DNA is a textual description of the broader business — process is one concern of many. The two overlap most in DNA's `Process` / `Step` / `Task` primitives.

> **Note (post-reorg, 2026-04):** This doc was written before the People/Structures/Activities reorg. Some examples reference the old "Resources-used-as-Roles" structural-typing model. The current shape splits Person, Role, Group, and Membership into first-class primitives — see [`README.md`](../../README.md) and [`ROADMAP.md`](../../ROADMAP.md). The conceptual mappings below still hold; concrete syntax examples may be outdated.

## Concept-by-concept mapping

| BPMN concept | DNA equivalent | Notes |
|---|---|---|
| **Process** | `Process` | 1:1. Both name a workflow. DNA adds `operator` (the owning Resource-as-Role) and an explicit `startStep`. |
| **Pool** (participant) | A scoping `Resource` (Group) | A pool typically scopes a Process to one organization or department. In DNA you'd reference the scoping Resource via the Operator and through Memberships, not as a separate primitive. |
| **Lane** (sub-participant) | `Resource` acting as a Role + Task.actor | BPMN swimlanes show "who does what." DNA expresses that via `Task.actor` (the Resource-as-Role bound to an Operation). Lanes don't have an authored shape; the partition is computed by grouping Steps by their Task's actor. |
| **Task** (atomic activity) | `Step` (orchestration) + `Task` (assignment) | BPMN conflates these. DNA splits: a Step is the orchestration node within a Process; a Task is the reusable `(actor, operation)` binding it references. The same Task can appear in multiple Steps across multiple Processes. |
| **User Task / Manual Task** | `Task` with `actor` of kind Role-Resource | BPMN's task type is implicit in DNA — a Task whose actor is a person-Role is a User Task. |
| **Service Task** | `Task` with a system-Resource as `actor` | A `Task` whose `actor` is a Resource referenced from a `schedule`/`webhook`-source Trigger or otherwise referenced as a non-human actor. See `examples/lending` (`NightlyDelinquencySweep`). |
| **Script Task** | Not modeled in Operational DNA | DNA does not currently have a named-computation primitive. Computational steps are typically modeled as Operations whose `changes[]` mutate Resource attributes, with the actual implementation deferred to a downstream cell. |
| **Send Task / Receive Task** | Not modeled | DNA does not currently model first-class messaging events. Cross-Process coordination is expressed via `Trigger.source = operation` (chain on Operation completion). |
| **Sequence Flow** | `Step.depends_on` | BPMN draws arrows; DNA enumerates predecessor Step IDs. AND-joins fall out naturally — multiple `depends_on` entries mean wait-on-all. |
| **Exclusive Gateway** (XOR) | `Step.conditions` + `Step.else` | A Step gated by `conditions` either runs or routes to its `else` (sibling step ID or `"abort"`). DNA's gate lives on the Step rather than as a separate node. |
| **Parallel Gateway** (AND) | Multiple Steps with shared `depends_on` | Fan-out is expressed by multiple Steps depending on the same predecessor; fan-in is multiple Step IDs in `depends_on`. No separate gateway primitive. |
| **Inclusive Gateway** (OR) | Not modeled | DNA intentionally omits inclusive-gateway semantics in v1. If your domain needs it, two Steps with separate conditions + a downstream merge approximates it. |
| **Event-Based Gateway** | `Trigger` with multiple `source` types | A Process triggered by either a webhook OR a schedule is two `Trigger` declarations targeting the same Process. |
| **Start Event** | `Process.startStep` + a `Trigger` targeting the Process | BPMN's start event is split in DNA: `startStep` names where execution begins; the Trigger says how it gets initiated. |
| **End Event** | Terminal Step (no successors) | Implicit. The Process is complete when its terminal Steps finish; DNA does not currently emit first-class events from terminal Steps. |
| **Intermediate Throw Event** | Not modeled | DNA does not currently emit first-class events mid-Process. State changes are captured in the Step's Operation's `changes[]`. |
| **Intermediate Catch Event** | Not modeled | DNA does not currently model inbound mid-Process events. Use `Trigger.source = operation` between Operations instead. |
| **Boundary Event** | Not modeled | DNA does not support attaching events to specific Steps. Compensation/timer-on-task semantics require a workflow-cell at runtime. |
| **Sub-Process** | A separate `Process`, called by chaining Triggers (`source: operation`) | DNA doesn't nest Processes inline. A "sub-process" is a separate Process whose Trigger is `source: operation` `after: <parent's terminal Operation>`. See `examples/mass-tort` (`SettlementDisbursement` chained off `Settlement.Accept`). |
| **Data Object / Data Store** | `Resource` with attributes | BPMN's data primitives are second-class to its flow. In DNA they're first-class Resources; everything else references them. |

## Where DNA intentionally differs

1. **DNA is textual, BPMN is graphical.** A DNA document round-trips through git diffs cleanly; a BPMN diagram doesn't. BPMN tools render DNA-style data; DNA tools could render BPMN-style diagrams (see `@dna-codes/dna-adapters/output/mermaid` for a flowchart projection).
2. **DNA separates orchestration (`Step`) from assignment (`Task`).** BPMN bundles both into a single Task node. DNA's split lets the same `(actor, operation)` binding appear in multiple Steps across multiple Processes — a real reuse pattern that BPMN re-models as call-activities.
3. **DNA doesn't have a Sub-Process primitive.** It has Processes that trigger other Processes via Operation chaining or Signals. The discipline forces a clean Trigger-driven boundary instead of a "this is just a nested box" shortcut.
4. **DNA doesn't have boundary events or compensation.** Those are runtime workflow concerns, deferred to the planned workflow-cell.
5. **DNA models actors structurally.** BPMN swimlanes are layout. DNA's Tasks reference Actor-Resources; Memberships pin Users to Roles within Groups — three-way relationships BPMN doesn't formally model.

## Concrete translation example

A simplified BPMN "Loan Approval" with a Borrower lane, an Underwriter lane, an exclusive gateway on `status == approved`, and a service task at the end:

**BPMN (sketch):**

```
[Start: New application] → (Borrower lane) [Submit] →
   (Underwriter lane) [Review] → <X status?> →
      [Approved] → (Service) [Disburse] → [End: Loan active]
      [Rejected] → [End: Loan rejected]
```

**DNA equivalent:** see [`examples/lending/operational.json`](../../examples/lending/operational.json) — `LoanOrigination` Process expresses the same flow, plus the things BPMN couldn't:

- The scheduled `Loan.Default` sweep (no swimlane needed; `NightlyDelinquencySweep` is a Resource referenced by a `schedule` Trigger).
- The CRM-webhook entry point alongside the human-initiated one (two Triggers, same Process).
- The `ApplicationIsPending` and `LoanIsApproved` Rules — composable, named, reusable across other Operations.

## Tooling intersections

- **DNA → BPMN-style diagram**: `@dna-codes/dna-adapters/output/mermaid` renders a flowchart per Process; the visual is recognizable to BPMN readers without claiming BPMN compliance.
- **BPMN → DNA**: not currently shipped. An `input/bpmn` adapter would parse BPMN XML into DNA Processes/Steps/Tasks and would surface each unmodeled construct (boundary events, inclusive gateways) as an explicit warning.

## See also

- [DDD comparison](./ddd.md) — for entity/aggregate modeling
- [Archimate comparison](./archimate.md) — for organization/role modeling at higher altitude
