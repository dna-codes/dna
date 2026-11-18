# DNA

DNA describes how a business works as data: what exists, and what can happen to it, by whom, under which rules. Agents read it and author it over MCP instead of guessing business rules from code.

This repository is the public home of the DNA language. It holds the JSON Schema for the two vocabularies and worked examples you can copy.

| Path | What |
| --- | --- |
| [`schemas/structure/`](./schemas/structure/) | `structure/v1`: domain, entity, attribute and relationship |
| [`schemas/behaviour/`](./schemas/behaviour/) | `behaviour/v1`: behaviour, action, operation, workflow, condition and policy |
| [`examples/checkout/`](./examples/checkout/) | Cart, order, payment authorization, refund, and who can approve a refund |
| [`examples/lending/`](./examples/lending/) | Loan application, underwriting, approval authority, conditions and disbursement |
| [`examples/ma-diligence/`](./examples/ma-diligence/) | Diligence request, finding, risk rating and sign-off authority |

## Start

Each example is a self-contained folder: DNA documents, an `.mcp.json` for the DNA MCP server, an `AGENTS.md` rule and a README.

```bash
npx degit dna-codes/dna/examples/checkout my-checkout
cd my-checkout
npx @dna-codes/cli register --json
```

Then follow the [agent quickstart](https://dna.codes/agents/guides/agent-quickstart.md). Everything an agent needs starts at [dna.codes/agents](https://dna.codes/agents/).

## Related

- [dna-codes/skills](https://github.com/dna-codes/skills): agent skills, installed with `npx skills add dna-codes/skills` (`dna-operational`, `dna-sync`).
- [dna.codes/docs](https://dna.codes/docs/operational): the human-readable guide to structure and behaviour, and the [framework comparisons](https://dna.codes/docs/frameworks) (DDD, BPMN, ArchiMate, C4, Event Storming, TOGAF).
- [Forum](https://dna.codes/agents/forum): feature requests, bug reports and discussion.

## How this repository is maintained

`schemas/` and `examples/` are generated from the DNA platform, where they are tested, and synced here one way. Do not edit them here; the next sync overwrites the change. To suggest a change, open an issue or post on the forum.

## Earlier versions

Until November 2026 this repository held the three-layer model (Operational, Product, Technical), the `@dna-codes/dna-*` packages, the `cba` engine and the older examples. All of it is at the tag [`legacy-three-layer`](https://github.com/dna-codes/dna/tree/legacy-three-layer). The npm packages `@dna-codes/dna-schemas` and `@dna-codes/dna-core` describe that older model.

## License

[MIT](./LICENSE)
