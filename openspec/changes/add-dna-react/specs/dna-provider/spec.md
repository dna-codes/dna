## ADDED Requirements

### Requirement: DnaProvider supplies DNA authorization context to its subtree
`DnaProvider` SHALL be a React context provider. It SHALL accept `dna` (an `OperationalDNA` document) and `userId` (string) as required props. It SHALL make the resolved permission state available to all descendant `<Operation>` components and `useOperation` calls without requiring props to be threaded through intermediate components.

#### Scenario: DnaProvider wraps a subtree
- **WHEN** `<DnaProvider dna={dna} userId="alice" roles={["Underwriter"]}>` wraps a component tree
- **THEN** descendant `useOperation` calls SHALL resolve against those roles without additional props

#### Scenario: useOperation outside DnaProvider throws
- **WHEN** `useOperation` is called outside a `DnaProvider`
- **THEN** it SHALL throw an error indicating the hook requires a `DnaProvider` ancestor

### Requirement: DnaProvider supports three role resolution strategies
`DnaProvider` SHALL accept exactly one of: `roles` (pre-resolved string array), `resolveRoles` (async function), or `store` (`DnaDataStore` instance). These are mutually exclusive. `roles` takes precedence if multiple are provided (no runtime error). When `resolveRoles` or `store` is provided, roles SHALL be resolved once at mount and cached for the provider's lifetime.

#### Scenario: Pre-resolved roles are used immediately
- **WHEN** `<DnaProvider roles={["Underwriter"]} …>` is mounted
- **THEN** `useOperation` SHALL reflect the resolved state synchronously with no loading phase

#### Scenario: resolveRoles is called once at mount
- **WHEN** `<DnaProvider resolveRoles={fn} …>` is mounted
- **THEN** `fn` SHALL be called exactly once with `userId` and the result cached

#### Scenario: store resolves roles via link traversal
- **WHEN** `<DnaProvider store={dnaDataStore} …>` is mounted
- **THEN** roles SHALL be resolved by querying links from the User instance matching `userId`

### Requirement: DnaProvider exposes an onAudit sink for audit events
`DnaProvider` SHALL accept an optional `onAudit` prop of type `(event: AuditEvent) => void | Promise<void>`. When provided, it SHALL be called by `perform()` with the audit event. Errors thrown by `onAudit` SHALL be caught and not propagate to the caller of `perform()`. The call is fire-and-forget — no delivery guarantee is implied.

#### Scenario: onAudit receives the event when perform() is called
- **WHEN** `perform({ loanId })` is called and `onAudit` is provided
- **THEN** `onAudit` SHALL be called with an `AuditEvent` containing `operation`, `resource`, `action`, `userId`, `timestamp`, `permitted`, and `payload`

#### Scenario: onAudit error does not propagate
- **WHEN** `onAudit` throws synchronously or rejects
- **THEN** `perform()` SHALL still return `{ permitted }` and not throw

### Requirement: DnaProvider accepts a feature flag resolver
`DnaProvider` SHALL accept an optional `flags` prop of type `(operationName: string) => boolean | Promise<boolean>`. When absent, all operations are considered enabled. The resolver SHALL be called per operation name at render time. A `Promise` result puts the gate into loading state until resolved.

#### Scenario: flags resolver disables an operation
- **WHEN** `flags={op => op === "Loan.Approve" ? false : true}` is provided
- **THEN** `<Operation name="Loan.Approve">` SHALL render its fallback, not its children

#### Scenario: Absent flags resolver enables all operations
- **WHEN** `DnaProvider` is mounted without a `flags` prop
- **THEN** all operations SHALL be considered enabled (flag gate is open)
