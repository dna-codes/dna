## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: No `file:` dep rewrites in publish CI
The publish workflow SHALL NOT contain any step that rewrites `file:` dependency paths to registry pins. Intra-repo deps SHALL use `workspace:*` in source, which npm rewrites to the actual version on publish automatically.

#### Scenario: Publish workflow has no dep-rewrite step
- **WHEN** `.github/workflows/publish.yml` is inspected
- **THEN** there is no script or step that modifies `package.json` files to replace `file:` paths

#### Scenario: Published package resolves its dna-core dep from registry
- **WHEN** a consumer installs `@dna-codes/cells` from npmjs.com
- **THEN** its declared dep on `@dna-codes/dna-core` resolves to a versioned registry range (e.g. `^0.11.0`), not a `file:` or `workspace:` path
