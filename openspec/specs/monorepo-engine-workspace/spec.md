# monorepo-engine-workspace Specification

## Purpose
TBD - created by archiving change monorepo-consolidation. Update Purpose after archive.
## Requirements
### Requirement: `engine/` workspace group exists in `dna/`
The `dna/` repository SHALL contain a top-level `engine/` directory that is a workspace group in `package.json#workspaces`. It SHALL contain exactly the packages migrated from `cells/`: `cba`, `cba-viz`, `cells`, `cells-api`, `cells-db`, `cells-ui`.

#### Scenario: Engine packages resolve in workspace
- **WHEN** `npm install` is run at the `dna/` root
- **THEN** all `engine/*` packages are linked as workspace members alongside `packages/*`

#### Scenario: Engine package count matches migrated set
- **WHEN** `ls engine/` is run
- **THEN** exactly six directories are present: `cba`, `cba-viz`, `cells`, `cells-api`, `cells-db`, `cells-ui`

### Requirement: Engine packages use `workspace:*` for intra-repo deps
Every engine package that depends on a `packages/*` package SHALL declare that dependency as `workspace:*`, not as a `file:` path or a registry pin.

#### Scenario: No `file:` deps in engine packages
- **WHEN** all `engine/*/package.json` files are inspected
- **THEN** no dependency value starts with `file:`

#### Scenario: `workspace:*` resolves to local package at install time
- **WHEN** `node -e "require('@dna-codes/dna-core')"` is run from an engine package directory after `npm install`
- **THEN** the resolved path is within the `dna/packages/core/` directory (not a registry download)

### Requirement: All engine packages build and test clean after migration
After migration, `npm run build --workspaces --if-present` and `npm test --workspaces --if-present` SHALL exit 0 from the `dna/` root.

#### Scenario: Build succeeds across all workspaces
- **WHEN** `npm run build --workspaces --if-present` is run at `dna/` root
- **THEN** exit code is 0 and no workspace reports a build error

#### Scenario: Tests pass across all workspaces
- **WHEN** `npm test --workspaces --if-present` is run at `dna/` root
- **THEN** exit code is 0 (or all failures are pre-existing, documented, and skipped)

### Requirement: Published package names and versions are preserved
The migration SHALL NOT change any `name`, `version`, or `publishConfig` field in any engine `package.json`. Published package identity (`@dna-codes/cells`, `@dna-codes/cells-viz`, `@dna-codes/cells-api`, `@dna-codes/cells-db`, `@dna-codes/cells-ui`) is unchanged.

#### Scenario: Package names unchanged after migration
- **WHEN** each engine `package.json` is inspected post-migration
- **THEN** the `name` field matches the original in `cells/`

#### Scenario: Versions unchanged after migration
- **WHEN** each engine `package.json` is inspected post-migration
- **THEN** the `version` field matches the original in `cells/`

