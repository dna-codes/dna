# build-operate-modes Specification

## Purpose

The dna-agent session operates in one of two modes — Build (type-focused: model and mature resource/relationship types) or Operate (instance-focused: create and wire real instances). The mode is a single session-wide setting that gates patch operations, the system prompt, and the available lens set.

## Requirements

### Requirement: Session has a Build/Operate mode

The dna-agent session SHALL carry a single mode setting `mode: "build" | "operate"`. `build` is the type-focused mode (model and mature resource/relationship types); `operate` is the instance-focused mode (create and wire real instances). The mode SHALL default to `build` and SHALL be one session-wide value (like the active pack), not per-type or per-user.

#### Scenario: Default mode is build

- **WHEN** a session is created without an explicit mode
- **THEN** the session mode is `build`

#### Scenario: Mode is a single session-wide value

- **WHEN** the session mode is read
- **THEN** exactly one of `build` or `operate` is returned for the whole session

### Requirement: Mode is readable and writable via REST

The MCP server SHALL expose the session mode through `GET /session-config` (response includes `mode`) and accept `POST /session-config` with `{ mode }` to switch mode at runtime without resetting the graph. `POST /reset` SHALL accept `{ pack, mode }` to start a fresh session in a chosen mode.

#### Scenario: GET returns current mode

- **WHEN** a GET request is made to `/session-config`
- **THEN** the response includes the active `pack` and the current `mode`

#### Scenario: POST switches mode without resetting the graph

- **WHEN** a POST request is made to `/session-config` with `{ mode: "operate" }`
- **THEN** the session mode becomes `operate`
- **THEN** existing instances and types in the graph are unchanged

#### Scenario: Reset starts a session in the chosen mode

- **WHEN** a POST request is made to `/reset` with `{ pack: "operational", mode: "build" }`
- **THEN** the store is reseeded with the operational pack
- **THEN** the session mode is `build`

### Requirement: Mode gates the available patch operations

Type-schema patch operations (`add_resource_type`, `add_relationship_type`, and updates to a type's stability) SHALL be permitted only in Build mode. In Operate mode the server SHALL reject these operations. Instance operations (`add_instance`, `add_link`, and their updates/removals) SHALL be permitted in both modes.

#### Scenario: Build mode allows type-schema operations

- **WHEN** the session mode is `build`
- **WHEN** a patch op includes `op: "add_resource_type"` or `op: "add_relationship_type"`
- **THEN** the operation is validated and applied normally

#### Scenario: Operate mode rejects type-schema operations

- **WHEN** the session mode is `operate`
- **WHEN** a patch op includes `op: "add_resource_type"` or `op: "add_relationship_type"`
- **THEN** `patch_graph` returns an error and no type is created

#### Scenario: Instance operations work in both modes

- **WHEN** a patch op includes `op: "add_instance"` or `op: "add_link"`
- **THEN** the operation proceeds normally regardless of mode

### Requirement: System prompt is gated by mode

The agent system prompt SHALL be built from the active mode so the agent's framing matches the current activity. `buildSystemPrompt` SHALL take the mode as input. The Build prompt SHALL describe modeling resource/relationship types, maturing them through the stability lifecycle (`experimental → beta → stable → deprecated`), and that simulation is a narrated dry-run (no instances are committed). The Operate prompt SHALL instruct the agent to map every concept to an existing registered type, never attempt type-schema ops, and follow the instance plan/apply/summarize protocol.

#### Scenario: Build prompt frames type modeling and simulation

- **WHEN** the session mode is `build`
- **THEN** the system prompt instructs the agent that it may create and mature types and that simulating a new type is a narrated walkthrough, not committed data

#### Scenario: Operate prompt forbids type creation

- **WHEN** the session mode is `operate`
- **THEN** the system prompt instructs the agent to map concepts to existing types and never call `add_resource_type` or `add_relationship_type`

### Requirement: Simulation in Build mode is a narrated dry-run

In Build mode, when the user asks how a proposed type would behave, the agent SHALL describe example instances and flows in conversation WITHOUT committing any instance to the graph. No `add_instance` or `add_link` op SHALL be issued as part of a simulation.

#### Scenario: Simulating a type creates no graph data

- **WHEN** the user asks the agent to simulate how a newly proposed type would operate
- **THEN** the agent narrates example instances and behavior
- **THEN** no `add_instance` or `add_link` operation is applied to the graph

### Requirement: Mode gates the lens set

The right-panel lens tab bar SHALL present a mode-appropriate lens set. Operate mode SHALL show the existing per-pack operational lenses (e.g. org-chart, pipeline, roster). Build mode SHALL show modeling lenses focused on the type registry and stability (at minimum `graph-explorer`). The agent's `activate_lens` routing SHALL be scoped to the active mode's lens IDs.

#### Scenario: Operate mode shows operational lenses

- **WHEN** the session mode is `operate` with the operational pack
- **THEN** the lens tab bar shows the operational instance lenses (e.g. org-chart, people-positions)

#### Scenario: Build mode shows modeling lenses

- **WHEN** the session mode is `build`
- **THEN** the lens tab bar shows the type/modeling lens set — `graph-explorer`, `org-chart`, `reporting-chains`, and `job-descriptions` — all rendering type-level views (see the `type-registry-lens` capability)

#### Scenario: Active lens falls back when hidden by a mode switch

- **WHEN** the user switches mode and the currently active lens is not valid in the new mode
- **THEN** the panel falls back to the first lens valid in the new mode

### Requirement: UI exposes a Build/Operate toggle

The `dna-agent` UI SHALL display the current mode and provide a two-segment Build/Operate control in place of the former lock toggle. Selecting a mode SHALL call `POST /api/session-config` with `{ mode }` and update the displayed state on success. The current mode SHALL be readable on load from the server session-config.

#### Scenario: Toggle switches from Build to Operate

- **WHEN** the user selects Operate while in Build mode
- **THEN** the UI updates to show Operate as active
- **THEN** the server rejects subsequent `add_resource_type` ops

#### Scenario: Mode visible without interacting

- **WHEN** the UI loads
- **THEN** the current mode is fetched from the server (`GET /api/session-config`) and displayed
- **THEN** the mode is not persisted client-side — the server session-config is the single source of truth

#### Scenario: Loading indicator while mode is unknown

- **WHEN** the UI has mounted but the `GET /api/session-config` request has not yet resolved
- **THEN** the mode control shows a loading indicator instead of a Build/Operate selection
- **THEN** the control becomes interactive once the server mode is known
