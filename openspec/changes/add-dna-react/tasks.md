## 1. Package scaffold

- [x] 1.1 Create `packages/react/` directory with `package.json` (`@dna-codes/dna-react`, peer deps: `react`, `react-dom`; dep: `@dna-codes/dna-core`)
- [x] 1.2 Add `packages/react` to root `package.json` workspaces
- [x] 1.3 Create `packages/react/tsconfig.json` extending the repo TypeScript config, targeting `dist/`
- [x] 1.4 Create `packages/react/src/index.ts` as the main export entry point (exports `DnaProvider`, `Operation`, `useOperation`, and `AuditEvent` type)
- [x] 1.5 Create `packages/react/README.md` documenting `DnaProvider`, `<Operation>`, and `useOperation` with usage examples

## 2. Types

- [x] 2.1 Define `AuditEvent` type: `operation`, `resource`, `action`, `userId`, `timestamp`, `permitted`, optional `payload`
- [x] 2.2 Define `DnaContextValue` internal type: `permitted(opName) → boolean`, `perform(opName, payload?) → Promise<{ permitted }>`, `loading: boolean`
- [x] 2.3 Define `RoleResolver` type alias: `(userId: string) => string[] | Promise<string[]>`
- [x] 2.4 Define `FlagResolver` type alias: `(operationName: string) => boolean | Promise<boolean>`

## 3. DnaProvider

- [x] 3.1 Create `packages/react/src/provider.tsx` with the `DnaProvider` component and React context
- [x] 3.2 Implement role resolution: accept `roles[]` (sync), `resolveRoles` (async fn), or `store` (`DnaDataStore`) — resolve once at mount and cache
- [x] 3.3 Implement `store` role resolution via `store.link.list({ from: { typeName: 'User', id: userId } })` mapping to role names
- [x] 3.4 Implement `can(opName)` using `getRulesForOperation` from `@dna-codes/dna-core` against resolved roles
- [x] 3.5 Implement `flags` resolver integration: call `flags(opName)` at render time; handle sync and async results
- [x] 3.6 Implement `perform(opName, payload?)`: re-check permission, stamp `AuditEvent`, call `onAudit` (swallow errors), return `{ permitted }`
- [x] 3.7 Expose `loading` state in context: `true` while roles or initial flag resolution is pending

## 4. Operation component

- [x] 4.1 Create `packages/react/src/operation.tsx` with the `<Operation>` component
- [x] 4.2 Implement permission + flag gate: read `permitted` and `enabled` from context; render children only when both are true
- [x] 4.3 Implement `fallback` prop (ReactNode, default `null`): render when gate is closed
- [x] 4.4 Implement `loading` prop (ReactNode, default `null`): render while context `loading` is true
- [x] 4.5 Ensure no re-entry into loading state after initial resolution (gate uses cached values)

## 5. useOperation hook

- [x] 5.1 Create `packages/react/src/use-operation.ts` with the `useOperation(name)` hook
- [x] 5.2 Return `{ permitted: boolean }` derived from context — reactive to role/flag changes
- [x] 5.3 Return `perform(payload?)` bound to the operation name — delegates to context `perform`
- [x] 5.4 Throw with a clear error message when called outside a `DnaProvider`

## 6. Tests

- [x] 6.1 Set up Jest + `@testing-library/react` in `packages/react/`
- [x] 6.2 Test `DnaProvider` with pre-resolved `roles[]`: verify `useOperation` reflects correct `permitted`
- [x] 6.3 Test `DnaProvider` with `resolveRoles`: verify loading state, then resolved state
- [x] 6.4 Test `<Operation>` renders children when permitted and enabled
- [x] 6.5 Test `<Operation>` renders fallback when not permitted
- [x] 6.6 Test `<Operation>` renders fallback when flag resolver returns false
- [x] 6.7 Test `<Operation>` renders loading prop during async resolution
- [x] 6.8 Test `perform()` fires `onAudit` with correct `AuditEvent` shape (permitted and blocked cases)
- [x] 6.9 Test `perform()` swallows `onAudit` errors and still returns `{ permitted }`
- [x] 6.10 Test `useOperation` outside `DnaProvider` throws

## 7. Example app

- [x] 7.1 Create `examples/react-app/` — a minimal Vite + React app demonstrating `DnaProvider`, `<Operation>`, and `useOperation`
- [x] 7.2 Add a `package.json` for the example app with `react`, `react-dom`, and a local path dep on `@dna-codes/dna-react`
- [x] 7.3 Create an in-memory mock API module (`src/mock-api.ts`) that simulates `perform()` round-trips (logs calls, returns `{ permitted }`) without a real back end
- [x] 7.4 Wire up a `DnaProvider` using the lending example DNA (`examples/lending/`) with pre-resolved roles for two demo users (an Underwriter and a Borrower)
- [x] 7.5 Build a demo UI with at least two `<Operation>` gates (`Loan.Apply` for Borrower, `Loan.Approve` for Underwriter) and a user-switcher to toggle between demo users
- [x] 7.6 Log audit events to the browser console via `onAudit` so they're visible during manual testing

## 8. Docs and README

- [x] 8.1 Update root `README.md` to document `@dna-codes/dna-react` in the packages table
