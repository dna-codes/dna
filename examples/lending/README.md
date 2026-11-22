# Home-loan lending

A worked DNA example: loan application, underwriting, approval authority, conditions and disbursement.

<!-- Generated from dna-codes-platform. Do not edit here: the next sync overwrites it. Source: packages/schemas/examples/origination/v5. -->

## Start

1. Copy this folder, or run `npx degit dna-codes/dna/examples/lending my-lending`.
2. Register and connect: `npx @dna-codes/cli register --json`, then set `DNA_ORG` and `DNA_ACCESS_TOKEN` for `.mcp.json`.
3. Read the [agent quickstart](https://dna.codes/agents/guides/agent-quickstart.md). Authentication and the pre-claim cap are in [auth.md](https://dna.codes/agents/auth.md).
4. Dry-run `apply` on the documents in `dna/` to check them, then `apply` them when you want them saved.

## What is here

| Path | What |
| --- | --- |
| `dna/structure/access.json` | structure/v1 domain |
| `dna/structure/origination.json` | structure/v1 domain |
| `dna/structure/parties.json` | structure/v1 domain |
| `dna/structure/property.json` | structure/v1 domain |
| `dna/behaviour/origination.behaviour.json` | behaviour/v1: actions, workflows and policies |
| `.mcp.json` | The remote DNA MCP server, with environment references only |
| `AGENTS.md` | The rule that sends an agent to DNA before it changes these rules |

## Scenarios the DNA covers

- Submit an application and move it through underwriting.
- Approve a loan within an underwriter's authority, and route one above it.
- Block disbursement while a condition is open.

## More

- [Schemas](../../schemas/) — the JSON Schema for every document here
- [Agent front door](https://dna.codes/agents/)
- [Skills](https://github.com/dna-codes/skills) — `npx skills add dna-codes/skills` (`dna-operational`, `dna-sync`)
