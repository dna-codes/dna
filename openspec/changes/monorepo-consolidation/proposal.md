## Why

The `dna/` and `cells/` repos co-evolve so tightly that every schema change in `dna/packages/` requires an immediate matching change in `cells/` — yet they live in separate repos, forcing `file:` dependency references as a workaround. This creates friction on every iteration and obscures the natural three-tier architecture: **packages** (language SDK), **engine** (framework/tools), **platform** (deployed apps).

## What Changes

- Move all `cells/` workspace packages into `dna/engine/` as a new top-level workspace group
  - `cells/packages/cba` → `dna/engine/cba`
  - `cells/packages/cba-viz` → `dna/engine/cba-viz`
  - `cells/packages/cells` → `dna/engine/cells`
  - `cells/technical/cells/api-cell` → `dna/engine/cells-api`
  - `cells/technical/cells/db-cell` → `dna/engine/cells-db`
  - `cells/technical/cells/ui-cell` → `dna/engine/cells-ui`
- Add `engine/*` to the `dna/` root workspace
- Replace all `file:../dna/packages/*` deps inside the engine packages with `workspace:*` refs
- Update `dna/README.md` to document the three-tier mental model
- Update `openspec/` docs and any spec references to the new structure
- `cells/` repo becomes dormant (no deletion — history preserved, README updated to point here)
- `dna-platform/` and `dna-codes-site/` remain as separate repos; their `file:../cells/...` deps updated to point at `../dna/engine/...`

## Capabilities

### New Capabilities

- `monorepo-engine-workspace`: The `dna/` monorepo gains an `engine/` workspace group containing all cell-based-architecture packages, with correct intra-repo workspace references and a unified build/test pipeline.
- `three-tier-documentation`: READMEs across the ecosystem are updated to document the three-tier model (packages / engine / platform) as the canonical mental model for the DNA ecosystem.

### Modified Capabilities

- `dna-codes-package-publishing`: The publish workflow now covers both `packages/*` and `engine/*`. No change to published package names or versions.

## Impact

- `dna/` — gains `engine/` directory and updated workspace config
- `cells/` — becomes a read-only archive; README points consumers to `dna/`
- `dna-platform/` — `file:../cells/...` deps updated to `file:../dna/engine/...`
- `dna-codes-site/` — same dep update if it references any cells packages
- CI/CD — any workflows in `cells/` that publish to npm need to move to `dna/`
- Published package names (`@dna-codes/cells`, `@dna-codes/cells-*`) — **unchanged**
