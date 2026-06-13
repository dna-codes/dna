## MODIFIED Requirements

### Requirement: User sets initial mode in the modal
The modal SHALL include a Build/Operate selection with a brief explanation of each: Build for modeling and maturing types, Operate for running operations on instances. The default SHALL be Build mode.

#### Scenario: Build mode is default
- **WHEN** the session setup modal opens
- **THEN** Build mode is pre-selected

#### Scenario: User can select Operate mode
- **WHEN** the user clicks the Operate option
- **THEN** the selection reflects Operate
- **THEN** confirming setup starts the session in Operate mode

### Requirement: Confirming setup seeds the store and starts the session
When the user confirms the modal, the UI SHALL call `POST /api/reset` with `{ pack, mode }`, wait for success, then dismiss the modal and allow the conversation to begin.

#### Scenario: Confirming setup seeds the selected pack
- **WHEN** the user confirms the modal with CRM pack and Operate mode selected
- **THEN** POST /api/reset is called with `{ pack: "crm", mode: "operate" }`
- **THEN** the store is reset and seeded with CRM types
- **THEN** the modal is dismissed and the chat is ready

#### Scenario: Setup failure shows an error
- **WHEN** POST /api/reset fails
- **THEN** the modal shows an error message
- **THEN** the modal remains open and the user can retry
