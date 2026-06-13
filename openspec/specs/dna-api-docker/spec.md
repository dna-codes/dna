# dna-api-docker Specification

## Purpose

Defines the Docker assets shipped with `@dna-codes/dna-api` for local-development deployment: a multi-stage `Dockerfile`, a single-org `docker-compose.yml` (one Neo4j + one API service), and a multi-example-org `docker-compose.examples.yml` (three parallel stacks for the lending / registry / mass-tort example DNAs). Each org runs in isolation with its own Neo4j instance — no shared multi-tenancy in v1. Local-dev only; production hardening (TLS, secrets, observability) is explicitly out of scope.

## Requirements

### Requirement: Dockerfile produces a runnable API container

The package SHALL ship a `Dockerfile` at `packages/api/Dockerfile` that performs a multi-stage TypeScript build (install → tsc → prune dev deps) and whose final image runs `node packages/api/dist/bin/dna-api.js serve`. The image SHALL expose port `4000` and accept Neo4j credentials via environment variables, the DNA file via the `DNA_FILE` env var (path inside the container), and an optional `PORT` env var.

#### Scenario: Image builds without error

- **WHEN** `docker build -f packages/api/Dockerfile -t dna-api .` is run from the repo root
- **THEN** the build succeeds and produces an image whose default CMD invokes the `dna-api` CLI

#### Scenario: Container fails fast on missing DNA

- **WHEN** the image is run with no `DNA_FILE` env var set
- **THEN** the container exits non-zero with a message referencing `DNA_FILE` or `--dna`

### Requirement: Single-org `docker-compose.yml` for local dev

The package SHALL ship `packages/api/docker-compose.yml` defining two services — `neo4j` and `api` — for single-org local development. The compose file SHALL mount a DNA file from the host into the API container, expose the API on host port `4000`, expose Neo4j HTTP on `7474` and Bolt on `7687`, and wire the API's Neo4j credentials env vars to point at the in-compose `neo4j` service.

#### Scenario: `docker compose up` brings both services online

- **WHEN** `docker compose -f packages/api/docker-compose.yml up -d` is run with a DNA file path provided
- **THEN** the `neo4j` service starts on host ports `7474`/`7687` and the `api` service starts on host port `4000`, with the API connecting to `neo4j` over the compose network

### Requirement: Multi-example-org `docker-compose.examples.yml` spins up three parallel stacks

The package SHALL ship `packages/api/docker-compose.examples.yml` defining three full stacks — `lending`, `registry`, and `mass-tort` — each comprising a dedicated `neo4j-<org>` service and a dedicated `api-<org>` service. The three stacks SHALL bind non-overlapping host ports (API: 4001/4002/4003; Neo4j HTTP: 7475/7476/7477; Neo4j Bolt: 7688/7689/7690). Each `api-<org>` service SHALL load the matching example DNA from `examples/<org>/operational.json`.

#### Scenario: All three stacks start without port collisions

- **WHEN** `docker compose -f packages/api/docker-compose.examples.yml up -d` is run from the repo root
- **THEN** three API services bind to host ports `4001`, `4002`, `4003` and three Neo4j services bind to non-overlapping HTTP and Bolt ports

#### Scenario: Each API loads the matching example DNA

- **WHEN** the three stacks are running
- **THEN** querying each API's GraphQL endpoint exposes a schema derived from the corresponding example DNA (e.g. the `lending` API includes a `Loan` GraphQL type, the `registry` API includes a `TypeDefinition` type)

#### Scenario: Stacks can be started individually

- **WHEN** `docker compose -f packages/api/docker-compose.examples.yml up -d api-lending neo4j-lending` is run
- **THEN** only the `lending` stack starts; `registry` and `mass-tort` services remain stopped

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
