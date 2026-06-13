# lens-tab-bar Specification

## Purpose
TBD - created by archiving change lens-tabs-and-graph-explorer. Update Purpose after archive.
## Requirements
### Requirement: LensPanelShell renders a tab bar with all available lenses

The system SHALL render a `LensPanelShell` component in the right half of `page.tsx` that contains a horizontal tab bar listing all available lens tabs: Org Chart, People → Positions, Reporting Chains, Span of Control, and Graph Explorer.

#### Scenario: Default tab on load
- **WHEN** the page loads
- **THEN** the Org Chart tab is active and its panel is rendered

#### Scenario: Switching tabs
- **WHEN** the user clicks a tab
- **THEN** the corresponding lens panel renders and the previous panel unmounts

### Requirement: All lens tabs re-fetch on graph patch

The system SHALL pass the `refreshSignal` value to every lens panel so that all tabs re-fetch their data when the agent patches the graph.

#### Scenario: Agent patches graph while Reporting Chains tab is active
- **WHEN** the agent calls `patch_graph` successfully and the Reporting Chains tab is active
- **THEN** the Reporting Chains panel re-fetches and re-renders with updated data

#### Scenario: Agent patches graph while a non-active tab exists
- **WHEN** the agent calls `patch_graph` successfully
- **THEN** all tab panels receive the updated `refreshSignal` and will re-fetch when next rendered

