# dna-codes-package-publishing Specification

## Purpose

Defines the registry, visibility, versioning, and access-control model for npm packages published from the `dna-codes/dna` repository. Packages publish to GitHub Packages (not npmjs.com), default to private visibility, and inherit access from repo collaboration. This is the canonical distribution policy for any `@dna-codes/dna-*` package.
## Requirements
### Requirement: Each package declares its source repository

Every `package.json` SHALL declare a `repository` field pointing at the source repo. npm uses this field for the registry's "Repository" link and for provenance metadata. It is RECOMMENDED but not required for authentication.

```json
"repository": "github:dna-codes/dna"
```

#### Scenario: Repository field absent on publish
- **WHEN** a `package.json` is published without a `repository` field
- **THEN** the publish succeeds, but the registry listing has no source-repo link; reviewers SHOULD add it before merge

#### Scenario: Repository field points at a different org
- **WHEN** `repository` declares an org other than `dna-codes`
- **THEN** the field is corrected before merge to match the actual source repo

### Requirement: Versions follow semver minor-bump for breaking changes pre-1.0

While packages remain pre-1.0, breaking changes (renames, schema breaks, API removals, **registry/distribution changes observable to consumers**) SHALL bump the **minor** version. The patch version is reserved for non-breaking fixes within a minor line. Major bumps are reserved for the eventual 1.0 release.

#### Scenario: A package rename bumps minor
- **WHEN** all packages are renamed from `@dna-codes/<name>` to `@dna-codes/dna-<name>`
- **THEN** every package's version moves from `0.3.x` (or `0.1.x` for newer ones) to `0.4.0`, not `1.0.0`

#### Scenario: Switching the publish registry bumps minor
- **WHEN** the distribution registry changes from GitHub Packages to npmjs.com
- **THEN** every non-private package bumps its minor version on its first npmjs.com publish, signaling the observably-breaking distribution change to consumers

### Requirement: Packages publish to npmjs.com under the public `@dna-codes` scope
Every package in this repo — both under `packages/*` and `engine/*` — SHALL publish to the default npm registry (`https://registry.npmjs.org`) under the `@dna-codes` scope, with public access.

Each package's `package.json#publishConfig` SHALL declare public access:

```json
"publishConfig": {
  "access": "public"
}
```

`publishConfig.registry` SHALL be omitted. `publishConfig.access` SHALL be `"public"` for every non-private package.

The root `package.json#workspaces` SHALL include both `packages/*` and `engine/*` so that `npm publish --workspaces` in CI covers the full published surface in a single pass.

#### Scenario: A non-private package missing publishConfig.access fails publish
- **WHEN** a `package.json` (in `packages/` or `engine/`) lacks `publishConfig.access: "public"` and is not marked `"private": true`
- **THEN** `npm publish` returns 402 Payment Required; the publish job exits non-zero

#### Scenario: Engine packages are published alongside SDK packages
- **WHEN** a release tag `v*` is pushed and the publish workflow runs
- **THEN** all non-private packages from both `packages/*` and `engine/*` are published in a single workflow run

#### Scenario: Already-published versions are skipped without error
- **WHEN** the publish workflow runs and some packages have not had their version bumped
- **THEN** those packages are skipped (not re-published) and the workflow exits 0

### Requirement: Packages are public; access flows from the npmjs.com registry

Published packages SHALL be publicly installable from npmjs.com with no per-consumer gating: no PAT requirement and no `~/.npmrc` configuration needed for installs. `dna-integration-jira` SHALL remain marked `"private": true` in its `package.json` and MUST NOT be published.

#### Scenario: Any consumer installs the packages with a default npm setup
- **WHEN** anyone runs `npm install @dna-codes/dna-core` against the default npm registry, with no `.npmrc` configuration
- **THEN** the package resolves and installs successfully

#### Scenario: A consumer with a stale @dna-codes scoped registry override
- **WHEN** a consumer's `~/.npmrc` still contains `@dna-codes:registry=https://npm.pkg.github.com` from the prior distribution model
- **THEN** their installs continue to resolve against GitHub Packages and pick up only the deprecated `0.4.x` versions; they MUST remove the scoped-registry line to receive new versions from npmjs.com

#### Scenario: A package marked private is not published
- **WHEN** the publish workflow iterates workspaces and encounters `dna-integration-jira` (`"private": true`)
- **THEN** npm skips it automatically; nothing is uploaded for that package

### Requirement: No `file:` dep rewrites in publish CI
The publish workflow SHALL NOT contain any step that rewrites `file:` dependency paths to registry pins. Intra-repo deps SHALL use `workspace:*` in source, which npm rewrites to the actual version on publish automatically.

#### Scenario: Publish workflow has no dep-rewrite step
- **WHEN** `.github/workflows/publish.yml` is inspected
- **THEN** there is no script or step that modifies `package.json` files to replace `file:` paths

#### Scenario: Published package resolves its dna-core dep from registry
- **WHEN** a consumer installs `@dna-codes/cells` from npmjs.com
- **THEN** its declared dep on `@dna-codes/dna-core` resolves to a versioned registry range (e.g. `^0.11.0`), not a `file:` or `workspace:` path

