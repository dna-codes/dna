## MODIFIED Requirements

### Requirement: Server enforces locked type registry
The locked/open state of the type registry SHALL be derived from the session mode, not an independent boolean: Operate mode is locked, Build mode is open. When the session mode is `operate`, the MCP server's `validatePatchOps` function SHALL reject any patch operation with `op: "add_resource_type"` or `op: "add_relationship_type"` with a human-readable violation message: `"Type registry is locked in Operate mode — switch to Build mode to add or change types."`.

#### Scenario: Operate mode blocks new resource type creation
- **WHEN** the session mode is `operate`
- **WHEN** a patch op includes `op: "add_resource_type"`
- **THEN** `patch_graph` returns an error with the lock violation message
- **THEN** no type is created

#### Scenario: Operate mode blocks new relationship type creation
- **WHEN** the session mode is `operate`
- **WHEN** a patch op includes `op: "add_relationship_type"`
- **THEN** `patch_graph` returns an error with the lock violation message
- **THEN** no type is created

#### Scenario: Operate mode allows adding instances and links
- **WHEN** the session mode is `operate`
- **WHEN** a patch op includes `op: "add_instance"` or `op: "add_link"`
- **THEN** the operation proceeds normally (mode only governs type schema changes)

#### Scenario: Build mode allows all patch operations
- **WHEN** the session mode is `build`
- **WHEN** any patch op type is submitted
- **THEN** normal validation rules apply with no lock rejection

### Requirement: Lock state is readable and writable via REST
The MCP server SHALL expose `GET /session-config` returning `{ pack: string, mode: "build" | "operate" }` and `POST /session-config` accepting `{ mode }` to switch mode at runtime without a full reset. The locked/open registry state is derived from `mode` (Operate ⇒ locked).

#### Scenario: GET returns current config
- **WHEN** a GET request is made to /session-config
- **THEN** the response includes the active pack name and current mode

#### Scenario: POST switches mode
- **WHEN** a POST request is made to /session-config with `{ mode: "operate" }`
- **THEN** subsequent patch_graph calls that include add_resource_type are rejected
- **WHEN** a POST request is made to /session-config with `{ mode: "build" }`
- **THEN** subsequent add_resource_type ops are allowed again

### Requirement: System prompt reflects lock state
The agent system prompt SHALL include the current mode so the agent knows whether to attempt type creation. Build framing tells the agent it may create and mature types; Operate framing tells the agent type creation is disabled.

#### Scenario: Operate prompt tells agent not to create types
- **WHEN** the session mode is `operate`
- **THEN** the system prompt instructs the agent that type creation is disabled and it must map all concepts to existing types

#### Scenario: Build prompt tells agent it can propose types
- **WHEN** the session mode is `build`
- **THEN** the system prompt instructs the agent that it may propose and mature types when no existing type fits

## REMOVED Requirements

### Requirement: UI exposes lock toggle
**Reason**: The standalone lock toggle is subsumed by the Build/Operate mode control. The locked/open state is now derived from mode, so a separate lock button would be a redundant, conflicting input.
**Migration**: Use the Build/Operate toggle defined in the `build-operate-modes` capability — Build mode is the former "open" state and Operate mode is the former "locked" state.
