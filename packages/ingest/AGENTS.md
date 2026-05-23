# AGENTS.md — `@dna-codes/dna-ingest`

Guidance for AI agents extending the orchestrator or writing reader-side `integration-*` packages that participate in it.

## What this package is

A thin coordinator. Two responsibilities, nothing else:

1. **Fetch** — given a list of source URIs, dispatch each by URI scheme to either a built-in fs fetcher (for `file://` and bare paths) or a caller-supplied `Integration`.
2. **Extract** — given fetched `{ contents, mimeType, source }`, dispatch by MIME type (with `*`-segment globs) to a caller-supplied `InputAdapter`.

Then it hands every per-source DNA chunk to `@dna-codes/dna-core`'s `merge()` and returns `{ dna, conflicts, errors, provenance }`.

## Hard rules

- **No `@dna-codes/dna-input-*` or `@dna-codes/dna-integration-*` runtime dependencies.** Ever. Including peer deps. Test for this in CI.
- **No package-internal fetcher beyond `file://`.** Every other scheme must go through caller-supplied integrations. Adding a built-in HTTP fetcher would creep this into a fat-hub.
- **Forward LLM options verbatim.** Do not default, mutate, or interpret `llm.{model, temperature, seed}`. The orchestrator's job is plumbing, not policy.
- **Fail soft per source.** A failed fetch or extract on one source records an `errors[]` entry and the run continues. Never let one source abort the whole call.
- **Bounded concurrency.** Default 4; configurable; reject `< 1`. Do not add advanced rate-limiting — that lives in individual integrations.

## Writing a new `integration-*` that participates

Implement the `Integration` interface (re-exported from this package). `fetch` is required; `write` is optional — read-only integrations leave it undefined.

```ts
import type { Integration, WritePayload, WriteResult } from '@dna-codes/dna-ingest'

export default function myIntegration(opts: MyOpts): Integration {
  return {
    async fetch(uri) {
      // 1. Auth, request, retry, rate-limit handling — your responsibility.
      // 2. Normalize PDF / Office / proprietary formats to text or bytes.
      // 3. Return { contents, mimeType, source: { uri, loadedAt: <ISO 8601> } }.
    },
    // Optional — only for bidirectional integrations.
    async write(target, payload): Promise<WriteResult> {
      // target identifies WHERE to write — a parent URI to create-under,
      // an existing object URI to update, or any integration-specific URI shape.
      // The returned `target` is the identifier of the resulting remote object
      // (which MAY differ from the input — e.g. creating a child returns the
      // new child's URI). Round-tripping bytes from fetch into write must be
      // a no-op at the byte level — same (contents, mimeType) shape.
    },
  }
}
```

Notes:

- **Integrations are pure I/O.** Library API takes/returns raw bytes plus MIME types — never DNA documents. Composition with `input-*`/`output-*` adapters lives in caller code or in the integration's own CLI. If you find yourself wanting to call `parse()` or `render()` from inside `fetch`/`write`, stop and put the call in the CLI instead.
- **PDF/Office text extraction belongs inside the integration.** Don't push that to the orchestrator. Each integration that supports such formats brings its own parser dependency — this scopes the dep correctly.
- **`mimeType` must be specific enough to route.** `text/markdown` is good; `application/octet-stream` will probably miss every input adapter. If you can sniff a more specific type, do.
- **`source.loadedAt` is fetch-time.** Not factory-time. Set it inside `fetch()` so retries get a fresh timestamp.
- **Errors thrown from `fetch()` / `write()` are caught upstream** (when invoked through the orchestrator's read path) and surfaced as `errors[]` entries. For direct callers, throw useful Errors with clear messages.
- **No `@dna-codes/dna-input-*` or `@dna-codes/dna-output-*` in `dependencies`.** Those packages may appear only in `devDependencies` and only be imported from CLI source files. The library code MUST stay adapter-free.

## Writing a new `input-*` that participates

`InputAdapter` matches the existing `input-text`/`input-transcript`/`input-image` shape:

```ts
type InputAdapter = (
  contents: string | Buffer,
  options: { llm: { model: string; temperature: number; seed: number } },
) => Promise<OperationalDNA>
```

If you're forking `input-example`, the function exported as the default already matches. The orchestrator passes `llm` through verbatim — your adapter is free to extend the second argument with adapter-specific fields, but `llm` must be respected as-is.

**Use the `@dna-codes/dna-core` builders to construct your output DNA.** Don't roll your own `Map<name, Resource>` accumulator — `addResource` / `addPerson` / `addOperation` / etc. handle identity-by-name composition, schema validation, and conflict surfacing for you. The walkers in `input-json` and `input-text/layered/constructor` both consume builders today; following the pattern keeps your adapter consistent and inherits the same schema enforcement.

```ts
import { createOperationalDna, addResource, addOperation, type OperationalDNA } from '@dna-codes/dna-core'

let dna: OperationalDNA = createOperationalDna({ domain: { name: 'my-domain' } })
;({ dna } = addResource(dna, { name: 'Foo', attributes: [...] }))
;({ dna } = addOperation(dna, { name: 'Foo.Do', target: 'Foo', action: 'Do' }))
return dna
```

See [`@dna-codes/dna-core`'s `docs/builders.md`](../core/docs/builders.md) for the full builder API.

## Reading and traversing DNA in transport packages

Packages that expose DNA through a transport layer (`dna-mcp`, `dna-api`, `dna-cli`) must use the **query API** from `@dna-codes/dna-core` rather than traversing raw `OperationalDNA` directly. Queries are pure, typed, and tested — they are the stable read contract that transport wrappers build on.

```ts
import {
  getOperation, getOperations,
  getActorsForOperation,
  getRulesForOperation,
  getOperationsForResource,
  // … full list in docs/queries.md
} from '@dna-codes/dna-core'

const op     = getOperation(dna, 'Loan.Approve')       // Operation | null
const actors = getActorsForOperation(dna, 'Loan.Approve') // Array<Role | Person>
```

See [`@dna-codes/dna-core`'s `docs/queries.md`](../core/docs/queries.md) for the full query API.

## Runtime-data integrations are an exception (DNA-aware)

The rule above ("don't return DNA from an integration") applies to
**external-system integrations** — Jira, Notion, Drive — whose job is to
ferry foreign content. Translation between foreign shapes and DNA
belongs in a dedicated `input-*` adapter, not in the integration.

**Runtime-data persistence integrations are different.** Their entire
purpose is to persist the data described by a DNA into a storage
backend. `@dna-codes/dna-adapters/integration/neo4j` and
`@dna-codes/dna-adapters/integration/memory` are the canonical examples —
both take an `OperationalDNA` at `createClient` time, and both expose a
type-generic data API (`instance.create(typeName, data)`) keyed on the
DNA's noun primitives. There is no foreign content to translate; the DNA
*is* the schema.

These integrations implement the `DnaDataStore` contract from
`@dna-codes/dna-core` and are NOT participants in the ingest pipeline —
they sit downstream, after a DNA has already been resolved. Treat them
as a documented exception, not a precedent for relaxing the
external-system rule. If you're building a new integration that does
participate in the ingest pipeline, default to pure I/O.

## Common pitfalls

- **Don't return DNA from an integration.** Some authors are tempted to skip the input-`*` step. Don't — it forces every integration to embed an LLM, duplicates extraction logic, and breaks the MIME dispatch story.
- **Don't reach for the merge utility from inside an integration.** `merge()` is the orchestrator's fan-in step; integrations return per-doc DNA chunks via the adapter, not pre-merged DNA.
- **Don't mutate the `contents` Buffer in-place.** The orchestrator may pass it to multiple consumers in future versions; treat fetched contents as immutable.
- **Don't bake retry policy into the orchestrator.** Bounded concurrency is in scope; per-integration backoff is not. If your integration needs retries, do it inside `fetch()`.

## Testing checklist for a new integration

- [ ] `package.json` declares no `@dna-codes/dna-input-*` and no other `@dna-codes/dna-integration-*` runtime/peer deps.
- [ ] Unit test: success path returns `{ contents, mimeType, source }` with a parseable ISO 8601 `loadedAt`.
- [ ] Unit test: failure path throws an Error with a useful message (the orchestrator records its `.message` into `errors[]`).
- [ ] Integration test (optional but recommended): drive your integration through `ingest()` with a stub `InputAdapter` that returns a fixed DNA chunk. Verify the chunk's source flows into `provenance`.
