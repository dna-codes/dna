# AGENTS.md — `@dna-codes/dna-integration-example`

Guidance for AI agents forking this template into a new `integration-*` package.

## Role in the pipeline

```
[external system] ⇄ integration-* ⇄ DNA ⇄ output-* → [external format]
```

An integration owns **everything system-specific** about talking to one external platform: auth, API versioning, pagination, rate limits, field mapping, webhook signature schemes, event semantics. Keep `input-*` and `output-*` packages generic; push per-system knowledge into the integration.

## Three surfaces, always

Every integration should ship:

| Surface | File | Purpose |
|---|---|---|
| **API client** | `client.ts` | Outbound calls. Pull records → DNA; push DNA → records. |
| **Webhook receiver** | `webhook.ts` | Inbound events. Verify signature, parse payload, return typed event. |
| **CLI** | `cli.ts` + `bin/` | Scripted / ad-hoc usage. At minimum: `pull`, `push`, `serve`. |

If your target system lacks one (e.g. no webhooks), delete the file and mention the absence in the README — don't ship a stub.

## How to fork

1. Copy the directory: `cp -R packages/integration-example packages/integration-<system>`
2. Update `package.json`:
   - `name` → `@dna-codes/dna-integration-<system>`
   - `bin` key → `integration-<system>: ./bin/integration-<system>.js`
   - `description` — one sentence stating the target system.
3. Rename `bin/integration-example.js` → `bin/integration-<system>.js` (keep it executable).
4. Replace `ExternalItem` / `ExternalListResponse` in `types.ts` with the real API's record shapes.
5. Replace `itemsToDna` / `dnaToItems` in `mapping.ts` with semantic translation that's actually meaningful for the target system (issues↔Resources, epics↔Processes, whatever fits).
6. In `client.ts`:
   - Set real endpoints, real auth (Bearer, OAuth, API key headers, …).
   - Implement real pagination (cursor, page, link headers).
   - Add retry/backoff if the API rate-limits.
7. In `webhook.ts`:
   - Set the real signature header name in `signatureHeader` default.
   - Update `WebhookEvent` to match the real payload shape.
   - If the provider uses a different signing scheme (Stripe's `t=...,v1=...`, GitHub's `sha256=...`, Slack's concatenated ts+body), rewrite `verifySignature` accordingly — don't loosen it.
8. In `cli.ts`: rename environment variable prefixes (e.g. `JIRA_*`, `GITHUB_*`).
9. Rewrite tests against the new shapes.
10. Update `AGENTS.md` and `README.md`.

## Pure I/O vs DNA-aware integrations

Most integrations are **pure I/O**: their library API takes URI / byte
strings, never DNA shapes. Composition with input/output adapters lives
in the integration's CLI (or in the caller). `integration/jira`,
`integration/google-drive`, and this template all follow this rule.

**Persistence / runtime-data integrations are a deliberate exception.**
`integration/neo4j` and `integration/memory` both take an
`OperationalDNA` at `createClient` time because DNA-awareness *is* the
whole purpose of a runtime-data store — there is no external system
supplying foreign content to translate. Their `migrate()` projects the
DNA's type system into the store; their per-Instance methods are
type-generic over Resource/Person/Role/Group names declared in that DNA.

When forking this template, ask which case you're in:

- **External system** (Jira, GitHub, Notion, Drive, Slack) → pure I/O.
  Keep DNA out of the library surface.
- **Storage backend** (Neo4j, Postgres, SQLite, S3) → DNA-aware exception
  is on the table. Document it in your `AGENTS.md` with the rationale.

If you're not sure, default to pure I/O — it's the safer commitment.

## Hard contract

- **Zero runtime dependencies** by default. Add a real dep (e.g. an SDK) only if rewriting it would be absurd. Document every added dep in `README.md`.
- **Constant-time signature comparison.** Use `crypto.timingSafeEqual`. Never a naive `===` on signature hex strings.
- **Fail closed on webhook verification.** A missing header, length mismatch, or bad secret must return `false` — never `true`.
- **CLI returns exit codes.** `0` on success, `64` on usage error, `1` on runtime error. Don't call `process.exit` from inside `runCli`; let the `bin/` shim do it.
- **Keep transport separate from mapping.** `client.ts` does HTTP; `mapping.ts` does semantic translation. Don't let them blend.

## Auth patterns

Choose one based on your target system; replace `Bearer <token>` in `client.ts`:

- **Bearer** (GitHub, Linear, OpenAI): `authorization: Bearer <token>`
- **Basic** (Jira Cloud): `authorization: Basic <base64(email:api-token)>`
- **OAuth 2.0** (Notion, Slack): store refresh token; refresh before calls that 401.
- **API key in header** (Airtable, SendGrid): custom header like `x-api-key`.
- **Signed request** (AWS SigV4): requires per-request signing — pull in a vetted helper.

## Webhook signature schemes (common)

| Provider | Algorithm | Header format |
|---|---|---|
| Generic HMAC | SHA-256 of body | `X-Signature: sha256=<hex>` |
| GitHub | SHA-256 of body | `X-Hub-Signature-256: sha256=<hex>` |
| Stripe | SHA-256 of `ts + "." + body` | `Stripe-Signature: t=<ts>,v1=<hex>` |
| Slack | SHA-256 of `v0:ts:body` | `X-Slack-Signature: v0=<hex>` + `X-Slack-Request-Timestamp` |
| Linear | SHA-256 of body | `Linear-Signature: <hex>` |

For timestamp-tolerant schemes (Stripe, Slack), **reject replays**: require the timestamp to be within 5 minutes of now.

## CLI conventions

- One subcommand per verb: `pull`, `push`, `serve`, plus any system-specific ones (`sync`, `diff`).
- Every command takes explicit flags (`--out`, `--in`, `--port`) — never positional magic.
- Credentials come from env vars (`<SYSTEM>_API_TOKEN`), not flags. CLI flags are logged; env vars aren't.
- `serve` should bind a minimal Node `http` server. If users want Express/Fastify, they import `parseWebhook` directly.

## Wiring into the workspace

After creating the directory, add it to the root `package.json` `workspaces` array and to the package table in the root `README.md`.

## Testing

```bash
npm run build -w @dna-codes/dna-integration-<system>
npm test   -w @dna-codes/dna-integration-<system>
```

Mock `fetch` for client tests (see `src/index.test.ts` for the pattern). For webhook tests, compute real HMACs with Node's `crypto` — don't stub them.
