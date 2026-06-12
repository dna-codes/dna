## ADDED Requirements

### Requirement: Server enforces locked type registry
When lock mode is active, the MCP server's `validatePatchOps` function SHALL reject any patch operation with `op: "add_resource_type"` or `op: "add_relationship_type"` with a human-readable violation message: `"Type registry is locked — switch to open mode to add new types."`.

#### Scenario: Locked mode blocks new resource type creation
- **WHEN** the registry is locked
- **WHEN** a patch op includes `op: "add_resource_type"`
- **THEN** `patch_graph` returns an error with the lock violation message
- **THEN** no type is created

#### Scenario: Locked mode blocks new relationship type creation
- **WHEN** the registry is locked
- **WHEN** a patch op includes `op: "add_relationship_type"`
- **THEN** `patch_graph` returns an error with the lock violation message
- **THEN** no type is created

#### Scenario: Locked mode allows adding instances and links
- **WHEN** the registry is locked
- **WHEN** a patch op includes `op: "add_instance"` or `op: "add_link"`
- **THEN** the operation proceeds normally (lock only governs type schema changes)

#### Scenario: Open mode allows all patch operations
- **WHEN** the registry is in open mode
- **WHEN** any patch op type is submitted
- **THEN** normal validation rules apply with no lock rejection

### Requirement: Lock state is readable and writable via REST
The MCP server SHALL expose `GET /session-config` returning `{ pack: string, locked: boolean }` and `POST /session-config` accepting `{ locked: boolean }` to toggle lock state at runtime without a full reset.

#### Scenario: GET returns current config
- **WHEN** a GET request is made to /session-config
- **THEN** the response includes the active pack name and current locked state

#### Scenario: POST toggles lock
- **WHEN** a POST request is made to /session-config with `{ locked: true }`
- **THEN** subsequent patch_graph calls that include add_resource_type are rejected
- **WHEN** a POST request is made to /session-config with `{ locked: false }`
- **THEN** subsequent add_resource_type ops are allowed again

### Requirement: UI exposes lock toggle
The `dna-agent` UI SHALL display the current lock state (locked / open) and provide a toggle control. The toggle SHALL call `POST /api/session-config` and update the displayed state on success.

#### Scenario: Toggle switches from open to locked
- **WHEN** the user clicks the lock toggle while in open mode
- **THEN** the UI updates to show "Locked" state
- **THEN** the server rejects subsequent add_resource_type ops

#### Scenario: Lock state visible without interacting
- **WHEN** the UI loads
- **THEN** the current lock state is fetched from the server and displayed

### Requirement: System prompt reflects lock state
The agent system prompt SHALL include the current lock mode so the agent knows whether to attempt type creation.

#### Scenario: Locked prompt tells agent not to create types
- **WHEN** lock mode is active
- **THEN** the system prompt instructs the agent that type creation is disabled and it must map all concepts to existing types

#### Scenario: Open prompt tells agent it can propose types
- **WHEN** open mode is active
- **THEN** the system prompt instructs the agent that it may propose new types when no existing type fits
