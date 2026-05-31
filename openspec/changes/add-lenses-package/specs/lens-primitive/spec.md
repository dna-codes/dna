## ADDED Requirements

### Requirement: A Lens is a named graph pattern governing query and command
A Lens SHALL be a named, reusable graph pattern consisting of typed node slots (`nodes[]`) and directed edge declarations (`edges[]`). A Lens SHALL govern two directions of use: the query direction (find all subgraphs in the graph matching this pattern) and the command direction (assert a specific binding of this pattern into the graph). Both directions use the same Lens definition — no separate schema is needed for each direction.

#### Scenario: Lens definition covers a multi-node subgraph
- **WHEN** a Lens is defined with five node slots and four edges
- **THEN** it SHALL be a valid Lens definition that can be used for both querying and commanding

#### Scenario: Lens definition covers a single-hop traversal
- **WHEN** a Lens is defined with two node slots and one edge
- **THEN** it SHALL be a valid Lens definition (the degenerate case — a traversal lens)

#### Scenario: Lens definition covers a layer grouping
- **WHEN** a Lens is defined with multiple node slots and zero edges
- **THEN** it SHALL be a valid Lens definition (the degenerate case — a layer lens)

### Requirement: A Lens carries a human-readable sentence template
A Lens MAY declare a `sentence` string with `{{slot}}` interpolation markers corresponding to named node slots. The sentence SHALL provide a human-readable reading of the graph pattern. When present, every `{{slot}}` marker in the sentence SHALL correspond to a declared node slot name. The sentence template SHALL be usable for both query results (fill with found values) and command assertions (fill with declared values).

#### Scenario: Sentence template references declared slots
- **WHEN** a Lens declares `sentence: "{{subject}} holds {{assignment}} within {{boundary}}"` and all three slots are declared in `nodes[]`
- **THEN** the Lens SHALL be valid

#### Scenario: Sentence template with undeclared slot is invalid
- **WHEN** a Lens declares a `{{slot}}` marker in its sentence that has no corresponding entry in `nodes[]`
- **THEN** the Lens SHALL fail validation

### Requirement: A Lens node slot declares a resource type
Each entry in a Lens `nodes[]` SHALL declare at minimum a `type` string naming a ResourceType. The `slot` field is optional for layer lenses (no traversal, no sentence interpolation needed) and required when the node is referenced by an edge or by the sentence template.

#### Scenario: Node with slot and type is valid
- **WHEN** a node entry is `{ "slot": "subject", "type": "User" }`
- **THEN** it SHALL be a valid Lens node

#### Scenario: Node with only type is valid for layer lenses
- **WHEN** a node entry is `{ "type": "Person" }` and the Lens has no edges and no sentence
- **THEN** it SHALL be a valid Lens node

### Requirement: A Lens edge declares from, to, and via
Each entry in a Lens `edges[]` SHALL declare three fields: `from` (slot name of the source node), `to` (slot name of the target node), and `via` (RelationshipType name string). All `from` and `to` values SHALL correspond to declared node slot names.

#### Scenario: Edge with from, to, via is valid
- **WHEN** an edge entry is `{ "from": "subject", "to": "assignment", "via": "User_Role" }` and both `subject` and `assignment` are declared node slots
- **THEN** it SHALL be a valid Lens edge

#### Scenario: Edge referencing undeclared slot is invalid
- **WHEN** an edge declares `"from": "unknown"` and no node has `"slot": "unknown"`
- **THEN** the Lens SHALL fail validation
