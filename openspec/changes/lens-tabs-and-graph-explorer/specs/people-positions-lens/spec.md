## ADDED Requirements

### Requirement: People → Positions lens shows filled and vacant positions

The system SHALL expose `GET /lens/people-positions` on the MCP server returning a list of positions, each with the person who fills it (or `null` if vacant). The dna-agent SHALL proxy this at `GET /api/lens/people-positions` and render it in `PeoplePositionsPanel`.

#### Scenario: Position is filled
- **WHEN** a Position instance has an incoming `fills` link from a Person instance
- **THEN** the lens entry shows the position name and the person's name

#### Scenario: Position is vacant
- **WHEN** a Position instance has no incoming `fills` link
- **THEN** the lens entry shows the position name and "Vacant"

#### Scenario: No positions in graph
- **WHEN** there are no Position instances in the store
- **THEN** the panel renders an empty state message
