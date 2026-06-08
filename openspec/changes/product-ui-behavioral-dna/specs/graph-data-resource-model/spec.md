## MODIFIED Requirements

### Requirement: ResourceType union covers all graph-studio noun types
The `ResourceType` union type SHALL include `"domain"`, `"group"`, `"position"`, `"person"`, `"process"`, `"step"`, `"workflow"`, `"page"`, `"section"`, `"component"`, `"element"`, `"ui-operation"`.

#### Scenario: Valid resource types
- **WHEN** a `GraphNode.type` value is checked against `ResourceType`
- **THEN** `"domain"`, `"group"`, `"position"`, `"person"`, `"process"`, `"step"`, `"workflow"`, `"page"`, `"section"`, `"component"`, `"element"`, `"ui-operation"` SHALL all be valid members

#### Scenario: role is not a valid resource type
- **WHEN** `"role"` is used as a `GraphNode.type`
- **THEN** TypeScript SHALL report a type error

### Requirement: RelationshipType union covers org-chart edge types
The `RelationshipType` union type SHALL include at minimum `"membership"`, `"reports_to"`, `"fills"`, `"belongs_to"`, `"contains"`, `"renders"`, `"triggers"`, `"navigates_to"`, `"calls"`, `"requires"`, `"updates"`.

#### Scenario: Valid relationship types
- **WHEN** a `GraphEdge.type` value is checked against `RelationshipType`
- **THEN** all defined edge type strings SHALL be valid members

#### Scenario: Product UI relationship types are valid
- **WHEN** `"contains"`, `"renders"`, `"triggers"`, `"navigates_to"`, `"calls"`, `"requires"`, or `"updates"` is used as a `GraphEdge.type`
- **THEN** TypeScript SHALL NOT report a type error
