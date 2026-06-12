## ADDED Requirements

### Requirement: Session setup modal shown on first load and after reset
The `dna-agent` UI SHALL display a `SessionSetupModal` overlay on initial page load (before any conversation is possible) and after the user triggers a reset. The modal SHALL be dismissed only by completing setup (selecting a pack and confirming), not by clicking outside.

#### Scenario: Modal appears on first load
- **WHEN** the page loads for the first time
- **THEN** the session setup modal is displayed over the full UI
- **THEN** the chat input is not interactable until setup is complete

#### Scenario: Modal appears after reset
- **WHEN** the user clicks the reset button and confirms
- **THEN** the conversation is cleared
- **THEN** the session setup modal is displayed again

### Requirement: User selects a starter pack in the modal
The modal SHALL present the available starter packs with their name, a one-line description, and the list of resource types they include. The user SHALL select exactly one pack. The default selection SHALL be `operational`.

#### Scenario: Pack options are displayed
- **WHEN** the session setup modal is open
- **THEN** three pack options are shown: Operational, CRM, HR
- **THEN** each option shows a description and the resource type names it seeds

#### Scenario: Operational pack is pre-selected
- **WHEN** the session setup modal first opens
- **THEN** the Operational pack is highlighted as the default selection

#### Scenario: User can change pack selection
- **WHEN** the user clicks a different pack option
- **THEN** that pack becomes the active selection
- **THEN** its type list is highlighted

### Requirement: User sets initial governance mode in the modal
The modal SHALL include a toggle for locked / open mode with a brief explanation of each. The default SHALL be open mode.

#### Scenario: Open mode is default
- **WHEN** the session setup modal opens
- **THEN** open mode is pre-selected

#### Scenario: User can select locked mode
- **WHEN** the user clicks the locked option
- **THEN** the toggle reflects locked state
- **THEN** confirming setup starts the session in locked mode

### Requirement: Confirming setup seeds the store and starts the session
When the user confirms the modal, the UI SHALL call `POST /api/reset` with `{ pack, locked }`, wait for success, then dismiss the modal and allow the conversation to begin.

#### Scenario: Confirming setup seeds the selected pack
- **WHEN** the user confirms the modal with CRM pack selected
- **THEN** POST /api/reset is called with `{ pack: "crm", locked: false }`
- **THEN** the store is reset and seeded with CRM types
- **THEN** the modal is dismissed and the chat is ready

#### Scenario: Setup failure shows an error
- **WHEN** POST /api/reset fails
- **THEN** the modal shows an error message
- **THEN** the modal remains open and the user can retry
