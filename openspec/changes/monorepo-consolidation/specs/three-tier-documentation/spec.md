## ADDED Requirements

### Requirement: `dna/` README documents the three-tier mental model
The `dna/` root `README.md` SHALL include a section explaining the three-tier ecosystem model with clear definitions and directory mapping for each tier.

The three tiers are:
- **Packages** — the DNA language SDK (`packages/*`). Published to npm as `@dna-codes/dna-*`. Language-agnostic primitives, TypeScript bindings, React hooks, adapters. Zero behavioral opinion.
- **Engine** — the framework and tools that read DNA and produce things (`engine/*`). Published to npm as `@dna-codes/cells*`. The `cba` CLI, cell engines (api, db, ui), and architecture viewer.
- **Platform** — deployed applications that consume the above as dependencies. Not published. Separate repos per product (`dna-platform/`, `dna-codes-site/`, etc.).

#### Scenario: New contributor understands where to add a new package
- **WHEN** a contributor reads the `dna/` README without prior context
- **THEN** they can determine from the three-tier section whether a new npm package belongs in `packages/` or `engine/`

#### Scenario: New contributor understands where deployed apps live
- **WHEN** a contributor reads the `dna/` README without prior context
- **THEN** they understand that deployed applications (like `dna.codes`) live in separate repos, not in `dna/`

### Requirement: `cells/` README is updated to point at `dna/engine/`
The `cells/` repository README SHALL be updated to indicate that active development has moved to `dna/engine/` in the `dna` monorepo, with a direct link to `dna/engine/` on GitHub. The README SHALL state that `cells/` is an archived read-only mirror.

#### Scenario: Developer finds `cells/` repo on GitHub
- **WHEN** a developer navigates to the `cells/` repo on GitHub
- **THEN** the first section of the README informs them the active source is at `dna/engine/` with a direct link

### Requirement: Each `engine/` package README references its location in the monorepo
Each package under `engine/` SHALL have a README (or an updated one if migrated from `cells/`) that notes it lives in the `dna` monorepo under `engine/<package-name>/`.

#### Scenario: Package README shows monorepo location
- **WHEN** the README for any `engine/*` package is read
- **THEN** it is clear the package lives in the `dna` monorepo, not a standalone repo
