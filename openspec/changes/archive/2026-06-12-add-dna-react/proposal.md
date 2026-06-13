## Why

DNA defines what operations exist, who can perform them, and under what conditions — but there is no first-class way to enforce those definitions in a React UI. This change adds `@dna-codes/dna-react`: a React package that connects DNA's authorization model to the component tree, gating rendering and capturing audit events when users perform operations.

## What Changes

- **New package `packages/react/`** (`@dna-codes/dna-react`) — peer to `packages/core/`, with `react` as a peer dependency and `@dna-codes/dna-core` as a runtime dependency
- **`<DnaProvider>`** — React context root supplying the operational DNA, current user identity, role resolution (via `DnaDataStore`, a custom resolver, or pre-resolved array), an audit sink (`onAudit`), and a feature flag resolver (`flags`)
- **`<Operation>`** — declarative rendering gate: renders children only when the current user is permitted to perform the named operation and the flag resolver returns enabled; renders a fallback or loading state otherwise
- **`useOperation(name)`** — imperative hook returning `{ permitted, perform(payload?) }`. `permitted` is the reactive boolean for rendering decisions. `perform()` re-checks permission at interaction time, fires the `onAudit` sink with the result, and returns `{ permitted }` to the caller

## Capabilities

### New Capabilities

- `dna-react-package`: Package scaffold for `@dna-codes/dna-react` — workspace entry, `package.json`, peer dep on React, dep on `@dna-codes/dna-core`, TypeScript build config
- `dna-provider`: The `DnaProvider` React context — props contract, role resolution strategies (`store` / `resolveRoles` / `roles[]`), async loading state, `onAudit` plug, `flags` plug
- `operation-gate`: The `<Operation>` component — permission + flag gate, `fallback` and `loading` props, children rendering contract
- `use-operation`: The `useOperation(name)` hook — `permitted` reactive state, `perform(payload?)` action, audit event shape, re-check-on-perform behavior

### Modified Capabilities

## Impact

- New package: `packages/react/` → `@dna-codes/dna-react`
- Root `package.json` — add `packages/react` to workspaces
- `README.md` — document the React package
- No changes to existing packages
