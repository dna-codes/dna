# Checkout — agent rules

<!-- Generated from dna-codes-platform. Do not edit here: the next sync overwrites it. -->

Before you change checkout permissions, refund rules, order status transitions or payment validation, use the DNA MCP tools (`list`, `get`, `validate`, `apply`).

- Read the DNA in `dna/` first. It is the source of these rules, not the code.
- Do not guess a business rule. If the DNA does not say, ask.
- Report each mismatch between the code and the DNA, and cite the DNA document.
- `validate` writes nothing, so use it freely on drafts. Call `apply` only when a person asks to save.
- When a result says `needs_claim`, a person must claim the organization. Hand the link to them.
