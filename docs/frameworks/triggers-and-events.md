# DNA ↔ Triggers and events (n8n, Zapier, GitHub Actions, EventBridge)

> **Canonical here.** This comparison has no page on [dna.codes/docs/frameworks](https://dna.codes/docs/frameworks); this file is the governing copy.

How DNA's `Trigger` primitive maps to the entry-point concepts in four widely-used event-driven workflow tools: **n8n**, **Zapier**, **GitHub Actions**, and **AWS EventBridge**. All four answer the same question — *what initiates a workflow?* — and all four converge on roughly the same handful of answers (a human, a clock, an inbound HTTP call, an upstream completion). DNA's `Trigger.source` enum (`user | schedule | webhook | operation`) is a deliberate distillation of that shared vocabulary, which is why this doc covers four tools in one page rather than four pages of mostly-identical content.

> Unlike the [BPMN](./bpmn.md) and [DDD](./ddd.md) docs, this one breaks the "one tool per page" pattern. The reasoning is in the change's [design notes](../../openspec/changes/archive/2026-04-25-add-cedar-and-trigger-framework-docs/design.md): n8n / Zapier / GHA / EventBridge are *implementations* of the same idea, not different conceptual frameworks, so a side-by-side reading is more useful than four separate pages.

## The DNA `Trigger` primitive at a glance

A DNA `Trigger` declares **what initiates an Operation or a Process**. It has exactly one `source`:

| `source` | What it means | Required companion field |
|---|---|---|
| `user` | A human (typically through a UI) initiates the target | — |
| `schedule` | A cron expression fires the target | `schedule` (cron string) |
| `webhook` | An inbound external event fires the target | `event` (event name) |
| `operation` | An upstream Operation's completion fires the target | `after` (Operation name) |

Every Trigger targets either an `Operation` (`Resource.Action`) or a `Process` (an SOP) — never anything else. See [`packages/schemas/operational/trigger.json`](../../packages/schemas/operational/trigger.json) for the canonical shape.

---

## Per-tool mappings

### n8n

[n8n](https://n8n.io/) is an open-source workflow automation tool. Workflows begin with a **Trigger node** — a designated first node whose job is to start an execution. n8n offers a Manual Trigger node, a Schedule Trigger, a Webhook Trigger, and dozens of app-specific trigger nodes (Slack Trigger, Gmail Trigger, etc.). Cron syntax in the Schedule Trigger follows standard 5-field cron.

| DNA source | n8n equivalent |
|---|---|
| `user` | **Manual Trigger** node (run from the editor) — closest analog. n8n also exposes "Execute Workflow" calls from another workflow, which approximates user-initiated when the caller is a UI |
| `schedule` | **Schedule Trigger** node (cron expression or interval) |
| `webhook` | **Webhook Trigger** node (auto-generated URL) — and dozens of **App-Trigger** nodes (Slack/Gmail/etc.) that wrap vendor webhooks |
| `operation` | No exact equivalent — n8n chains nodes via execution data flow within a single workflow rather than declaring a Trigger that references an upstream Operation. The closest analog is an **Execute Workflow** node calling another workflow whose first node is an Execute Workflow Trigger |

### Zapier

[Zapier](https://zapier.com/) is a SaaS automation tool built around the **Zap** — a one-trigger-many-actions pipeline. Every Zap starts with a single trigger, drawn from a library of thousands of app-specific templates ("New email in Gmail", "New row in Google Sheets"). Zapier also ships a generic Webhooks-by-Zapier trigger and a Schedule-by-Zapier trigger.

| DNA source | Zapier equivalent |
|---|---|
| `user` | **Run Zap** (manual run from the dashboard) — and the **Push by Zapier** browser-extension trigger |
| `schedule` | **Schedule by Zapier** (every day / hour / week / month) |
| `webhook` | **Webhooks by Zapier** (catch hook) — plus hundreds of app-specific wrappers like "New email in Gmail" or "New row in Airtable" |
| `operation` | No first-class equivalent — Zapier chains within one Zap's action steps. Multi-Zap chains use the **Sub-Zap** pattern or storage-based handoffs; neither is a Trigger primitive |

### GitHub Actions

[GitHub Actions](https://docs.github.com/actions) is GitHub's CI/CD-and-automation service. A workflow file declares its trigger(s) under the `on:` key. The keys most relevant to DNA's `Trigger.source` enum are `workflow_dispatch` (manual), `schedule` (cron), `repository_dispatch` (external HTTP), and the family of repository events (`push`, `pull_request`, `issues`, etc.).

| DNA source | GitHub Actions equivalent |
|---|---|
| `user` | `on: workflow_dispatch` (the "Run workflow" button) |
| `schedule` | `on: schedule` with a `cron:` expression (UTC) |
| `webhook` | `on: repository_dispatch` (external HTTP-initiated) and the repository-event family (`push`, `pull_request`, `release`, `issues`, …) — every event is an inbound webhook from GitHub itself or a caller |
| `operation` | `on: workflow_run` (one workflow's completion triggers another) — the closest analog to DNA's `source: "operation"` with `after:` |

### EventBridge

[AWS EventBridge](https://docs.aws.amazon.com/eventbridge/) is a managed event bus. Workflows are expressed as **rules** that match against an **event pattern** (for event-bus rules) or fire on a cron/rate (for **scheduled rules**). EventBridge also has **API destinations** for outbound HTTP and the **Pipes** primitive for source-to-target plumbing.

| DNA source | EventBridge equivalent |
|---|---|
| `user` | No equivalent — EventBridge is event-driven only; there is no "human clicked Run" primitive on a rule. A user-initiated invocation is modeled as an application call to `PutEvents`, which is one layer above the rule itself |
| `schedule` | **Scheduled rules** (cron or rate expression) — and the newer **EventBridge Scheduler** service for finer scheduling control |
| `webhook` | **Event-pattern rules** on the default or a custom bus — inbound events arrive via `PutEvents`, partner event sources, or AWS service events |
| `operation` | **Event-pattern rules** matching events emitted by an upstream service (e.g., a Lambda's success event). EventBridge doesn't have a "after Operation X" primitive per se; you wire it up by emitting a custom event from the upstream and matching on it downstream |

---

## Where DNA intentionally differs

These four tools collectively offer features DNA does not. Each omission is deliberate; the reasoning is consistent across them.

**EventBridge's expressive event-pattern filtering.** EventBridge rules can match against arbitrarily nested JSON pathways with operators for prefix, suffix, anything-but, numeric ranges, IP CIDR, and existence checks. DNA's `Trigger` has no payload-filter primitive at all — entry gating is expressed as a first `Step` in the kicked-off Process with `conditions: [<RuleName>]` and `else: "abort"`. This is intentional: DNA describes *that* a Trigger fires from an event, not *which subset* of payload shapes qualify. Payload-level filtering is a runtime concern that belongs in the Technical layer or in the event router itself (EventBridge, Kafka Streams, etc.). DNA pushes that complexity out of the description; a previously-shipped `Trigger.condition` field was removed because `Step.conditions` was strictly more general (it also handles mid-Process branching).

**Zapier's per-app trigger templates.** Zapier ships thousands of app-specific triggers ("New starred email in Gmail", "New paid invoice in Stripe"). DNA is tool-agnostic by design — it doesn't ship app-specific Trigger types because the app catalog is unbounded and changes weekly. A DNA `Trigger` with `source: "webhook"` and `event: "stripe.invoice.paid"` carries the same information without coupling the description to a vendor's API. The cost is real: Zapier users get auto-discovered fields and instant connection wizards; DNA users get a stable description that survives vendor renames.

**n8n's data flow between nodes.** n8n's strongest feature is the way data flows from node to node within a single workflow — you can reference any upstream node's output via expressions, transform it inline, and branch on it. DNA's `Trigger` is a declaration of *what initiates* a target; it does not carry payload schemas, transformations, or routing logic. Orchestration in DNA happens through `Process` / `Step` / `Task` (see the [BPMN comparison](./bpmn.md)) and data shapes are pushed to the Product/Technical layers. The split is intentional: keeping Triggers stateless makes them composable, but you'll need a separate primitive for everything past the entry point.

**GitHub Actions' event filtering on push/pull_request.** GHA lets you filter `on: push` by branches, paths, and tags (`branches: [main]`, `paths: ['src/**']`). DNA has no such filter primitive on Trigger. Same reasoning as the EventBridge case: DNA describes *that* a webhook fires the Operation; whether a particular push qualifies is a deployment concern, not a description-of-the-business concern.

---

## Concrete translation example

A typical GitHub Actions workflow that runs CI on every push to `main`:

```yaml
on:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

The trigger half of that — the `on:` block — translates to a single DNA `Trigger`:

```json
{
  "operation": "Code.Push",
  "source": "webhook",
  "event": "github.push.main",
  "description": "GitHub push to the main branch kicks off CI."
}
```

A few notes on the translation:

- The `branches: [main]` filter is **not** in the DNA Trigger — that's the "GitHub Actions' event filtering" omission described above. The branch constraint lives in the Technical layer (the actual GitHub workflow file) or in the event name itself (`github.push.main` rather than just `github.push`), depending on how granular the team wants the description to be.
- The `jobs.ci` block has no DNA equivalent at the Trigger level — that's orchestration. If the CI flow had multiple gated steps in DNA, those would belong in a `Process` whose `startStep` runs `Code.Push` (or whose Trigger had a `process:` reference instead of an `operation:` reference).
- DNA leaves the runner, the checkout step, and the `npm test` command entirely to the Technical layer. The Trigger says *what kicks off CI* — it does not describe how CI runs.

---

## See also

- [Framework comparisons index](./README.md)
- [BPMN 2.0](./bpmn.md) — for the orchestration sibling: once a Trigger fires, `Process` / `Step` / `Task` describe the workflow that follows
- [Event Storming](./event-storming.md) — for the workshop framing: a DNA `Trigger` is the closest analog to a Storming Policy sticky (the lavender "whenever X happens, do Y" note)
- [DDD](./ddd.md) — for the broader event-driven vocabulary that informs both DNA's Triggers and the tools above
