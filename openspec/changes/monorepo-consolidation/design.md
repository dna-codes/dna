## Context

The `dna/` repo publishes `@dna-codes/dna-*` packages and the `cells/` repo publishes `@dna-codes/cells*` packages. Both live under the same parent directory (`/Apps/dna-codes/`). `cells/` declares `file:../dna/packages/*` dependencies on `dna-core` and `dna-schemas` for local dev, then rewrites those to registry pins (`^0.4.0`) in CI before publishing — a publish workflow workaround for what is effectively a monorepo constraint. The two repos co-evolve: every DNA schema change touches both, and the `cells/` CI workaround is a source of drift risk if the pinned versions lag.

`dna-platform/` is a separate deployed application repo that consumes both ecosystems via published npm packages (not `file:` deps). It stays external.

## Goals / Non-Goals

**Goals:**
- Merge `cells/` packages into `dna/` under a new `engine/` workspace group
- Replace all `file:../dna/packages/*` refs in engine packages with `workspace:*` refs
- Unify publish CI: one `publish.yml` in `dna/` covers both `packages/*` and `engine/*`
- Document the three-tier mental model (packages / engine / platform) in READMEs
- Preserve all published package names and versions exactly

**Non-Goals:**
- Migrating `dna-platform/` or `dna-codes-site/` into this repo
- Changing any `@dna-codes/*` package names, scopes, or published APIs
- Removing the `cells/` repo (it stays as an archived read-only pointer)
- Changing `dna-platform/`'s dep strategy (it already uses published npm versions)

## Decisions

### 1. `engine/` as the top-level directory name (not `framework/` or `tools/`)

The three-tier model is: **packages** (language/SDK), **engine** (framework/tools), **platform** (deployed apps). Using `engine/` as the directory name makes the tier name self-documenting in the repo structure. Alternatives considered:
- `framework/` — connotes a prescribed usage pattern; cells are more general
- `tools/` — understates the cell engines (api-cell, db-cell, ui-cell are not utilities)
- `cells/` — mirrors the old repo name but would be confusing alongside `packages/`

### 2. Workspace references use `workspace:*`

Inside the monorepo, engine packages reference dna packages as `workspace:*`. This resolves to the local workspace copy at install time and is rewritten to the actual version range by `npm pack`/`npm publish` — no CI rewrite step needed. The existing `cells/` CI workaround (node script that patches `file:` to `^0.4.0`) is deleted entirely.

Alternative considered: keeping `file:` refs — rejected because `file:` in a workspace is redundant and semantically weaker than `workspace:*`.

### 3. Single unified `publish.yml`

The existing `dna/` publish workflow iterates over workspaces and skips `private: true` packages. Adding `engine/*` to the workspace array automatically includes those packages in the same publish pass — no workflow changes needed beyond adding the workspace entries. The `cells/` publish workflow is retired.

### 4. `cells/` repo becomes a read-only archive

The `cells/` repo is not deleted — git history, issues, and any external links are preserved. Its README is updated to point to `dna/engine/` and its `main` branch is tagged `archived`. No force-push or branch deletion. External consumers who have `cells/` cloned will see the archive notice on next pull.

### 5. `engine/` package directory layout mirrors `cells/` layout exactly

```
engine/
  cba/          ← cells/packages/cba
  cba-viz/      ← cells/packages/cba-viz
  cells/        ← cells/packages/cells
  cells-api/    ← cells/technical/cells/api-cell
  cells-db/     ← cells/technical/cells/db-cell
  cells-ui/     ← cells/technical/cells/ui-cell
```

The `technical/cells/` nesting in the old repo was an artifact of the CBA project structure; flattening under `engine/` is cleaner and consistent with how `packages/` is organized.

## Risks / Trade-offs

- **`cells/` external cloners** — Any team or tool that `git clone`s `cells/` directly will see the archive notice but their local build will still work until they update deps. Low risk; `dna-platform/` already uses published npm versions, not `file:` refs.
- **Tag collision** — Both repos use `v*` tags to trigger publish. After consolidation, a single tag triggers one publish pass covering both `packages/` and `engine/`. If `packages/` and `engine/` packages need to publish at different versions, they still can — the workflow skips already-published versions. No blocking issue.
- **`npm ci` vs lockfile** — The `cells/` lockfile contains `file:` paths that won't exist after the move. The `dna/` lockfile needs to be regenerated after adding `engine/` workspaces. This is a one-time `npm install` after the migration.

## Migration Plan

1. Copy each `cells/` package directory into `dna/engine/` (preserving package names and versions)
2. Rewrite `file:../dna/packages/*` → `workspace:*` in each engine `package.json`
3. Add `engine/*` entries to `dna/package.json#workspaces`
4. Run `npm install` in `dna/` to regenerate lockfile with workspace refs resolved
5. Run `npm run build --workspaces` to verify all packages build
6. Run `npm test --workspaces` to verify tests pass
7. Update `dna/README.md` with three-tier model documentation
8. Update `cells/README.md` to point at `dna/engine/`
9. Archive `cells/` repo (tag + README update, no deletion)

**Rollback**: The `cells/` repo is preserved. If anything is wrong, `dna-platform/` already resolves deps from npm — it is unaffected. The engine packages in `dna/engine/` can be removed without affecting `packages/`.

## Open Questions

- Should `cba-viz` stay in `engine/` or eventually move to `platform/` (since it's an interactive viewer app, not a published SDK)? For now it stays in `engine/` — it ships as an npm package (`@dna-codes/cells-viz`), so it belongs with the other published packages until there's a reason to move it.
