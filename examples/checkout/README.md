# Checkout

A worked DNA example: cart, order, payment authorization, refund, and who can approve a refund.

<!-- Generated from dna-codes-platform. Do not edit here: the next sync overwrites it. Source: packages/schemas/examples/checkout/v4. -->

## Start

1. Copy this folder, or run `npx degit dna-codes/dna/examples/checkout my-checkout`.
2. Register and connect: `npx @dna-codes/cli register --json`, then set `DNA_ORG` and `DNA_ACCESS_TOKEN` for `.mcp.json`.
3. Read the [agent quickstart](https://dna.codes/agents/guides/agent-quickstart.md). Authentication and the pre-claim cap are in [auth.md](https://dna.codes/agents/auth.md).
4. Dry-run `apply` on the documents in `dna/` to check them, then `apply` them when you want them saved.

## What is here

| Path | What |
| --- | --- |
| `dna/structure/commerce.json` | structure/v1 domain |
| `dna/structure/fulfilment.json` | structure/v1 domain |
| `dna/structure/parties.json` | structure/v1 domain |
| `dna/structure/payments.json` | structure/v1 domain |
| `dna/behaviour/commerce.behaviour.json` | behaviour/v1: actions, workflows and policies |
| `dna/behaviour/fulfilment.behaviour.json` | behaviour/v1: actions, workflows and policies |
| `dna/behaviour/payments.behaviour.json` | behaviour/v1: actions, workflows and policies |
| `.mcp.json` | The remote DNA MCP server, with environment references only |
| `AGENTS.md` | The rule that sends an agent to DNA before it changes these rules |

## Scenarios the DNA covers

- Place an order, authorize the payment, then capture it.
- Request a refund under the threshold (automatic) and over it (needs approval).
- Cancel an unpaid order.

## More

- [Schemas](../../schemas/) — the JSON Schema for every document here
- [Agent front door](https://dna.codes/agents/)
- [Skills](https://github.com/dna-codes/skills) — `npx skills add dna-codes/skills` (`dna-operational`, `dna-sync`)
