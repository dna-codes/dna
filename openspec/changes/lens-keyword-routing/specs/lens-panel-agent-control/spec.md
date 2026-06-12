## ADDED Requirements

### Requirement: page.tsx holds agentLens signal state
`page.tsx` SHALL hold `agentLens: { lensId: string; seq: number } | null` state (initialized to `null`) and a `handleActivateLens(lensId: string)` callback that sets it with a monotonically incrementing `seq`. This ensures repeated calls with the same `lensId` still trigger the effect.

#### Scenario: repeated same lensId triggers effect
- **WHEN** `handleActivateLens("org-chart")` is called twice in a row
- **THEN** `agentLens.seq` increments on the second call so `LensPanelShell` still receives a changed value

#### Scenario: null on mount
- **WHEN** the page first mounts
- **THEN** `agentLens` is `null` and no agent-driven tab override is active

### Requirement: LensPanelShell accepts agentLens prop and syncs activeTab
`LensPanelShell` SHALL accept `agentLens: { lensId: string; seq: number } | null`. A `useEffect` watching `agentLens` SHALL call `setActiveTab(agentLens.lensId)` if and only if the `lensId` exists in the current pack's tab list OR in `savedLenses`. Unknown IDs SHALL be silently ignored.

#### Scenario: valid pack tab ID switches tab
- **WHEN** `agentLens` is set to `{ lensId: "job-descriptions", seq: 1 }`
- **THEN** the Job Descriptions tab becomes active

#### Scenario: valid saved lens ID switches tab
- **WHEN** `agentLens` is set to a `lensId` matching a saved lens UUID
- **THEN** that saved lens tab becomes active

#### Scenario: unknown lensId is ignored
- **WHEN** `agentLens` is set to `{ lensId: "nonexistent", seq: 1 }`
- **THEN** the active tab does not change

#### Scenario: pack mismatch is ignored
- **WHEN** the active pack is `crm` and `agentLens.lensId` is `"job-descriptions"` (an operational tab)
- **THEN** the active tab does not change

### Requirement: manual tab clicks override agent state
Manual tab clicks in `LensPanelShell` SHALL continue to call `setActiveTab` directly. The user's manual selection SHALL take effect immediately regardless of the current `agentLens` value.

#### Scenario: manual click wins after agent switch
- **WHEN** the agent activates `"pipeline"` and the user then clicks the `"accounts"` tab
- **THEN** the `"accounts"` tab becomes active
