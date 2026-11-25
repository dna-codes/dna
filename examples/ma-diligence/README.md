# M&A diligence

A worked DNA example: diligence request, finding, risk rating and sign-off authority.

<!-- Generated from dna-codes-platform. Do not edit here: the next sync overwrites it. Source: packages/schemas/examples/diligence/v6. -->

## Start

1. Copy this folder, or run `npx degit dna-codes/dna/examples/ma-diligence my-ma-diligence`.
2. Register and connect: `npx @dna-codes/cli register --json`, then set `DNA_ORG` and `DNA_ACCESS_TOKEN` for `.mcp.json`.
3. Read the [agent quickstart](https://dna.codes/agents/guides/agent-quickstart.md). Authentication and the pre-claim cap are in [auth.md](https://dna.codes/agents/auth.md).
4. Dry-run `apply` on the documents in `dna/` to check them, then `apply` them when you want them saved.

## What is here

| Path | What |
| --- | --- |
| `dna/structure/diligence.json` | structure/v1 domain |
| `dna/structure/organization.access.json` | structure/v1 domain |
| `dna/structure/parties.json` | structure/v1 domain |
| `dna/structure/workspace.access.json` | structure/v1 domain |
| `dna/behaviour/diligence.behaviour.json` | behaviour/v1: actions, workflows and policies |
| `.mcp.json` | The remote DNA MCP server, with environment references only |
| `AGENTS.md` | The rule that sends an agent to DNA before it changes these rules |

## Scenarios the DNA covers

- Open a diligence request and record a finding against it.
- Rate a finding's risk and route a high rating for sign-off.
- Sign off residual risk with the authority the DNA names.

## More

- [Schemas](../../schemas/) — the JSON Schema for every document here
- [Agent front door](https://dna.codes/agents/)
- [Skills](https://github.com/dna-codes/skills) — `npx skills add dna-codes/skills` (`dna-operational`, `dna-sync`)
