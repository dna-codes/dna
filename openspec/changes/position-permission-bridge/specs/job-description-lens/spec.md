## MODIFIED Requirements

### Requirement: JobDescriptionCanvas renders a formatted document per position

The job-description lens SHALL render one formatted document per `Position` (renamed from operational `Role`), resolving the position's actions, memberships (via `Membership.position`), and scope. The transform and canvas SHALL reference the `Position` resource type; all other rendering behavior is unchanged.

#### Scenario: One document per Position
- **WHEN** the lens runs over an operational graph
- **THEN** it produces one job-description document per declared `Position`, sourced from `Position` nodes and `Membership.position` edges
