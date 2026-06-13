# agent-type-pushback Specification

## Purpose
TBD - created by archiving change agent-first-foundation. Update Purpose after archive.
## Requirements
### Requirement: Agent checks for type overlap before creating a new type

When a user proposes a concept that does not map to any registered type, the agent SHALL reason over all registered `ResourceType` and `RelationshipType` records in context to detect semantic overlap before proposing or creating a new type. The agent SHALL surface any detected overlap to the user with a specific suggestion.

#### Scenario: Agent surfaces a likely duplicate type
- **WHEN** a user says "I want to add a concept called Squad" and a `Team` ResourceType with `category: "group"` is already registered
- **THEN** the agent responds with a message such as "You already have a 'Team' type (group category) — does 'Squad' mean something different, or is it an alias for Team?"

#### Scenario: Agent surfaces a likely alias
- **WHEN** a user says "I want to add a 'Staff Member' type" and a `Person` ResourceType with `category: "person"` is registered
- **THEN** the agent suggests that 'Staff Member' may be an alias for `Person` and asks the user to confirm before creating

#### Scenario: Genuinely novel type proceeds without pushback
- **WHEN** a user proposes a concept with no semantic overlap to any registered type
- **THEN** the agent proceeds directly to confirming the new type name and creating it at `stability: experimental`

### Requirement: User can override pushback and proceed with new type creation

After the agent surfaces an overlap concern, the user SHALL be able to explicitly confirm that the new type is intentionally distinct. On confirmation, the agent SHALL create the new type at `stability: experimental` without further objection.

#### Scenario: User confirms distinct intent after pushback
- **WHEN** the agent raises an overlap concern and the user responds "yes, Squad is different — it's time-bounded and cross-functional"
- **THEN** the agent creates a new `Squad` ResourceType at `stability: experimental` and confirms the creation

#### Scenario: User accepts the existing type after pushback
- **WHEN** the agent raises an overlap concern and the user responds "you're right, Team works fine"
- **THEN** the agent does not create a new type and maps the original intent to the existing `Team` type

### Requirement: New types proposed by the agent are created at `stability: experimental`

Every `ResourceType` or `RelationshipType` created through the agent conversation flow SHALL be assigned `stability: experimental` at creation time. The agent SHALL communicate this to the user: "I've created 'Squad' as an experimental type."

#### Scenario: New type is created with experimental stability
- **WHEN** the agent creates a new ResourceType at the user's request
- **THEN** the stored record has `stability: "experimental"`

#### Scenario: Agent communicates experimental status to the user
- **WHEN** the agent successfully creates a new type
- **THEN** the conversation response includes a statement that the type was created as experimental

### Requirement: Pushback reasoning is grounded in the loaded registry, not hallucinated

The agent's pushback assessment SHALL be based solely on the registered types loaded from `get_type_registry()` at conversation start. The agent SHALL NOT invent or hallucinate type names that are not in the registry when making overlap suggestions.

#### Scenario: Pushback only references real registered types
- **WHEN** the agent surfaces an overlap concern
- **THEN** every type name it mentions as a potential match EXISTS in the registry returned by `get_type_registry()`

