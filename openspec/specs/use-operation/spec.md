# use-operation Specification

## Purpose
TBD - created by archiving change add-dna-react. Update Purpose after archive.
## Requirements
### Requirement: useOperation returns permitted state and a perform action
`useOperation(name: string)` SHALL return `{ permitted: boolean, perform: (payload?: unknown) => Promise<{ permitted: boolean }> }`. `permitted` SHALL be the reactive boolean reflecting the current user's authorization state for the named operation, updated whenever the provider's resolved roles change. It SHALL be `false` during the loading phase (roles or flags unresolved).

#### Scenario: permitted is true for an allowed role
- **WHEN** the current user holds a role in the operation's allow list
- **THEN** `useOperation("Loan.Approve").permitted` SHALL be `true`

#### Scenario: permitted is false for a disallowed user
- **WHEN** the current user holds no role in the operation's allow list
- **THEN** `useOperation("Loan.Approve").permitted` SHALL be `false`

#### Scenario: permitted is false during loading
- **WHEN** roles have not yet resolved from an async `resolveRoles`
- **THEN** `permitted` SHALL be `false` until resolution completes

### Requirement: perform() re-checks permission at interaction time and fires onAudit
`perform(payload?)` SHALL re-resolve the current user's permission for the operation at call time (using the cached roles from the provider). It SHALL call the provider's `onAudit` sink — if present — with an `AuditEvent` before returning, regardless of whether the user is permitted or not. It SHALL return `Promise<{ permitted: boolean }>`.

#### Scenario: perform() fires onAudit for a permitted action
- **WHEN** `perform({ loanId: "123" })` is called and the user is permitted
- **THEN** `onAudit` SHALL be called with `{ operation: "Loan.Approve", resource: "Loan", action: "Approve", userId, timestamp, permitted: true, payload: { loanId: "123" } }`
- **AND** `perform()` SHALL resolve to `{ permitted: true }`

#### Scenario: perform() fires onAudit for a blocked action
- **WHEN** `perform()` is called and the user is not permitted
- **THEN** `onAudit` SHALL be called with `permitted: false`
- **AND** `perform()` SHALL resolve to `{ permitted: false }` (no throw)

#### Scenario: perform() returns permitted false if onAudit throws
- **WHEN** `onAudit` throws or rejects
- **THEN** `perform()` SHALL still resolve to `{ permitted }` and SHALL NOT propagate the error

### Requirement: AuditEvent carries operation identity, user, and timestamp
Every `AuditEvent` emitted by `perform()` SHALL include: `operation` (the full operation name, e.g. `"Loan.Approve"`), `resource` (parsed from the operation name before the first `.`), `action` (parsed from the operation name after the first `.`), `userId` (from the provider), `timestamp` (ISO 8601 string stamped at call time), `permitted` (boolean), and an optional `payload` (the value passed to `perform()`).

#### Scenario: AuditEvent parses resource and action from operation name
- **WHEN** `perform()` is called for `useOperation("Loan.Approve")`
- **THEN** the emitted `AuditEvent` SHALL have `resource: "Loan"` and `action: "Approve"`

#### Scenario: AuditEvent includes caller payload
- **WHEN** `perform({ loanId: "abc" })` is called
- **THEN** the emitted `AuditEvent` SHALL have `payload: { loanId: "abc" }`

#### Scenario: AuditEvent timestamp is an ISO 8601 string
- **WHEN** `perform()` is called
- **THEN** `AuditEvent.timestamp` SHALL be a valid ISO 8601 date-time string representing the call time

### Requirement: useOperation does not gate rendering
`useOperation` SHALL NOT conditionally suppress rendering. It returns data only — the caller decides what to do with `permitted`. The rendering gate is the responsibility of `<Operation>`.

#### Scenario: useOperation returns permitted false without hiding children
- **WHEN** `const { permitted } = useOperation("Loan.Approve")` and `permitted` is false
- **THEN** the component using the hook SHALL still render; hiding children is the caller's responsibility

