## MODIFIED Requirements

### Requirement: Docker assets are documented in the package README

The package `README.md` SHALL document the registry-native model: first-boot DNA seeding semantics, what happens on subsequent boots (DNA-drift warning, no re-seeding), the four foundational `ResourceType` records (`Person`, `Role`, `Group`, `Resource`), the schema hot-reload behavior on type mutations (including the sub-second unavailability window), the version stamp on every Resource, and the v1 limitations (no auth, no Rule enforcement, no retroactive migration, no DNA hot-reload). It SHALL document both compose files: a Quick-start block for the single-org `docker-compose.yml` (commands to start, point at a DNA file, query GraphQL — including a `createResourceType` mutation example), and a separate Quick-start block for the multi-example-org `docker-compose.examples.yml` (commands, the port table, GraphQL endpoints per org). The README SHALL also state that the Docker setup is local-dev only (no TLS, no secrets management, no production hardening) and SHALL include a "Migrating from v0.1.0 to v0.2.0" runbook pointing at `scripts/migrate-to-registry.ts`.

#### Scenario: README documents single-org compose usage

- **WHEN** `packages/api/README.md` is read
- **THEN** it includes a Quick-start section for `docker-compose.yml` with at least one `docker compose up` invocation, a DNA-mount example, and a sample GraphQL query against `http://localhost:4000/graphql`

#### Scenario: README documents the examples compose usage with the port table

- **WHEN** `packages/api/README.md` is read
- **THEN** it includes a Quick-start section for `docker-compose.examples.yml` showing the three orgs, their host ports, and the example DNAs they load

#### Scenario: README declares local-dev scope

- **WHEN** `packages/api/README.md` is read
- **THEN** it explicitly states the Docker assets are for local development only and lists production concerns (TLS, secrets, monitoring) as out of scope for v1

#### Scenario: README explains the registry-native seed flow

- **WHEN** `packages/api/README.md` is read
- **THEN** it explicitly describes (a) the DNA file as a seed, (b) the first-boot detection mechanism, (c) what happens on subsequent boots with a drifted DNA file (warn-only), AND (d) the four foundational `ResourceType` records seeded automatically

#### Scenario: README explains schema hot-reload

- **WHEN** `packages/api/README.md` is read
- **THEN** it documents that `createResourceType` / `updateResourceType` / `deleteResourceType` mutations trigger a schema rebuild and notes the sub-second unavailability window during the swap

#### Scenario: README includes a v0.1 → v0.2 migration runbook

- **WHEN** `packages/api/README.md` is read
- **THEN** it includes a "Migrating from v0.1.0 to v0.2.0" section explaining how to invoke the `packages/api/scripts/migrate-to-registry.ts` script against an existing Neo4j instance
