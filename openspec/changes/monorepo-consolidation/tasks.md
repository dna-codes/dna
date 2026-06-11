## 1. Create `engine/` workspace structure

- [x] 1.1 Create `engine/` directory at the `dna/` repo root
- [x] 1.2 Copy `cells/packages/cba` → `engine/cba`
- [x] 1.3 Copy `cells/packages/cba-viz` → `engine/cba-viz`
- [x] 1.4 Copy `cells/packages/cells` → `engine/cells` (N/A — `packages/cells` does not exist in `cells/`; only `cba` and `cba-viz` are under `packages/`)
- [x] 1.5 Copy `cells/technical/cells/api-cell` → `engine/cells-api`
- [x] 1.6 Copy `cells/technical/cells/db-cell` → `engine/cells-db`
- [x] 1.7 Copy `cells/technical/cells/ui-cell` → `engine/cells-ui`

## 2. Rewrite intra-repo deps to `workspace:*`

- [x] 2.1 In `engine/cba/package.json`, replace all `file:../dna/packages/*` deps with `workspace:*` (npm uses `"*"` — `workspace:*` is pnpm/Yarn only; updated to `"*"` and removed stale GitHub Packages `publishConfig.registry`)
- [x] 2.2 In `engine/cba-viz/package.json`, replace all `file:../dna/packages/*` deps with `workspace:*` (same: `"*"`)
- [x] 2.3 In `engine/cells/package.json`, replace all `file:../dna/packages/*` deps with `workspace:*` (N/A — package does not exist)
- [x] 2.4 In `engine/cells-api/package.json`, replace all `file:../dna/packages/*` deps with `workspace:*`
- [x] 2.5 In `engine/cells-db/package.json`, replace all `file:../dna/packages/*` deps with `workspace:*`
- [x] 2.6 In `engine/cells-ui/package.json`, replace all `file:../dna/packages/*` deps with `workspace:*`
- [x] 2.7 Verify no `file:` deps remain in any `engine/*/package.json` (only `@joint/plus: "file:joint-plus.tgz"` remains in `cba-viz` — this is a bundled local binary, not a cross-repo dep)

## 3. Update workspace config and lockfile

- [x] 3.1 Add `"engine/cba"`, `"engine/cba-viz"`, `"engine/cells-api"`, `"engine/cells-db"`, `"engine/cells-ui"` to `package.json#workspaces` in `dna/` root
- [x] 3.2 Run `npm install` at `dna/` root to regenerate lockfile with workspace refs resolved
- [x] 3.3 Verify all engine packages appear in the lockfile as workspace members

## 4. Verify build and tests

- [x] 4.1 Run `npm run build --workspaces --if-present` from `dna/` root — all engine packages build clean; graph-studio fails on Google Fonts network block (pre-existing, unrelated to migration)
- [x] 4.2 Run `npm test --workspaces --if-present` from `dna/` root — all 40 cba tests pass after fixing migrated paths; cells-api/cells-ui have pre-existing schema-drift failures that fail identically in the original `cells/` repo
- [x] 4.3 Verify `@dna-codes/dna-core` resolves to `dna/packages/core/` — confirmed via `require.resolve` from within `engine/cba`

## 5. Update publish CI

- [x] 5.1 Confirm `dna/` publish workflow covers `engine/*` automatically — workflow reads `package.json#workspaces` at runtime; no changes needed
- [x] 5.2 Verify the publish workflow has no `file:` rewrite step — confirmed 0 occurrences
- [x] 5.3 Confirm each engine `package.json` has `"publishConfig": { "access": "public" }` — all five confirmed; `registry` field removed

## 6. Documentation

- [x] 6.1 Update `dna/README.md` — added **Ecosystem** section with three-tier model table and annotated directory tree
- [x] 6.2 Update `dna/README.md` — updated Packages section to split into **Packages** and **Engine** subsections with full package table for engine
- [x] 6.3 Update each `engine/*/README.md` — all five packages have READMEs with monorepo location note
- [x] 6.4 Update `cells/README.md` — archive notice added pointing to `dna/engine/` on GitHub

## 7. Archive `cells/` repo

- [x] 7.1 Commit `cells/README.md` archive update and push to `cells/main`
- [x] 7.2 Tag `cells/` repo as `archived` — tagged and pushed to GitHub
- [ ] 7.3 (Optional) Use GitHub's "Archive this repository" setting on the `cells/` repo to make it read-only on GitHub
