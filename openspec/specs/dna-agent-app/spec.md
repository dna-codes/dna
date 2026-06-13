# dna-agent-app Specification

## Purpose
TBD - created by archiving change agent-first-foundation. Update Purpose after archive.
## Requirements
### Requirement: App exists at `apps/dna-agent` as a Next.js workspace member

A new Next.js application SHALL live at `apps/dna-agent/` in the monorepo. It SHALL be added to the root `package.json#workspaces` array and use `engine/ui-library` for UI components. It SHALL connect to the `packages/mcp` server at a URL configured via environment variable (`DNA_MCP_URL`).

#### Scenario: App workspace is registered
- **WHEN** the root `package.json` is read
- **THEN** `apps/dna-agent` is present in the `workspaces` array

#### Scenario: App starts with a configured MCP URL
- **WHEN** `DNA_MCP_URL` is set and `npm run dev` is run in `apps/dna-agent`
- **THEN** the development server starts without errors

### Requirement: App displays a two-panel layout — conversation and live lens

The app's primary view SHALL be a two-panel layout: a conversation panel on the left and a live org-chart lens panel on the right. The layout SHALL use `Application` and `Sidebar` components from `engine/ui-library`.

#### Scenario: Both panels are visible on load
- **WHEN** a user opens the app in a browser
- **THEN** they see a conversation input area on the left and an org-chart visualization on the right

### Requirement: Conversation panel streams agent responses

The conversation panel SHALL send user messages to a Next.js API route that invokes Claude (via `@anthropic-ai/sdk`) with the DNA MCP server connected as an MCP client. Agent responses SHALL stream to the UI as they are produced, showing tool call progress (e.g., "Querying type registry…", "Patching graph…") before the final text response.

#### Scenario: User message produces a streaming response
- **WHEN** a user types a message and submits
- **THEN** the conversation panel begins displaying the agent's response incrementally, not all at once

#### Scenario: Tool call progress is surfaced during streaming
- **WHEN** the agent calls an MCP tool during its response
- **THEN** a progress indicator appears in the conversation panel naming the tool being called

### Requirement: Org-chart lens re-renders after graph patches

After the agent calls `patch_graph` and receives a success response, the org-chart lens panel SHALL refresh to reflect the updated graph. The refresh SHALL occur without a full page reload.

#### Scenario: New position appears in org chart after patch
- **WHEN** the agent successfully adds a new position via `patch_graph`
- **THEN** the org-chart panel updates to show the new position within the current conversation turn, without a page reload

#### Scenario: Org chart does not reload on non-mutating agent turns
- **WHEN** the agent responds to a query without calling `patch_graph`
- **THEN** the org-chart panel does not reload or flicker

### Requirement: Org-chart panel shows a loading state during refresh

While the org-chart lens is being fetched or re-fetched after a patch, the panel SHALL display a loading indicator rather than a blank or stale view.

#### Scenario: Loading state appears during lens refresh
- **WHEN** the org-chart panel is re-fetching lens data
- **THEN** a skeleton or spinner is displayed until the data arrives

