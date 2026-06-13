## Context

DNA's operational layer already models everything needed for UI authorization: `Rule` declares which roles may perform which operations; `getActorsForOperation` and `getRulesForOperation` query that model. What's missing is a React binding that makes those queries reactive and colocated with the component tree.

`@dna-codes/dna-react` is a thin React layer over `@dna-codes/dna-core`. It does not duplicate any schema or query logic — it consumes the existing query API and exposes it as a context + component + hook.

## Goals / Non-Goals

**Goals:**
- Provide a React context (`DnaProvider`) that resolves the current user's roles and makes DNA authorization available throughout the tree
- Provide a declarative rendering gate (`<Operation>`) for permission + feature-flag gating
- Provide an imperative hook (`useOperation`) for cases requiring more control, including audit capture via `perform()`
- Keep the audit sink fire-and-forget: capture and hand off, no delivery guarantees required
- Stay agnostic about role resolution source (store, auth provider, pre-resolved)

**Non-Goals:**
- Server-side authorization enforcement — this package is UI-only; the back end must validate independently
- Audit log durability or ordering guarantees — the `onAudit` sink is best-effort
- React Server Components — targeting client components only for now
- Condition rule evaluation — DNA condition rules depend on runtime instance state not available to the provider
- Code generation for type-safe operation names — deferred

## Decisions

### 1. Single `useOperation` hook; no separate `useCan`

`useOperation(name)` returns `{ permitted, perform }`. Permission-only checks use `const { permitted } = useOperation(name)`. A separate `useCan` hook would be a thin alias with no added value.

Alternatives considered:
- `useCan(name)` as a separate hook — redundant; `permitted` from `useOperation` covers the case

### 2. `<Operation>` and `useOperation` are complementary, not redundant

`<Operation>` is declarative — use it when the gate is colocated with the children. `useOperation` is imperative — use it when you need `perform()` or when the rendering logic is more complex. You never need both for the same operation in the same component.

### 3. Three role resolution strategies, in priority order

```
roles[]         → highest priority, pre-resolved (SSR-safe, no async)
resolveRoles()  → async custom function (bridges any auth system)
store           → DnaDataStore link traversal (convenience when store is available)
```

If `store` is provided, role resolution queries `store.link.list({ from: { typeName: 'User', id: userId } })` and maps to role names. This only works cleanly when store instance IDs match auth IDs — callers with a mismatch should use `resolveRoles`.

### 4. `perform()` always re-checks permission and always fires `onAudit`

`permitted` at render time may be stale by interaction time (role revoked, flag changed). `perform()` re-resolves permission at call time and fires `onAudit` with `permitted: boolean` regardless of the result. Blocked attempts are auditable events.

```ts
type AuditEvent = {
  operation: string    // "Loan.Approve"
  resource:  string    // "Loan"  — parsed from operation name at "."
  action:    string    // "Approve"
  userId:    string
  timestamp: string    // ISO 8601, stamped by perform()
  permitted: boolean
  payload?:  unknown   // caller-provided context
}
```

`perform()` returns `Promise<{ permitted: boolean }>` so callers can branch after the audit fires.

### 5. `flags` resolver is per-operation, called at render time

```ts
flags?: (operationName: string) => boolean | Promise<boolean>
```

Async flag resolution is supported. `<Operation>` treats an unresolved flag as `loading` (renders `loading` prop, not `fallback`). `permitted` and `enabled` are both required for children to render — they are independent gates.

### 6. Loading state is separate from fallback

```tsx
<Operation
  name="Loan.Approve"
  fallback={<span>No access</span>}   // not permitted or not enabled
  loading={<Skeleton />}              // roles or flags still resolving
>
  <ApproveButton />
</Operation>
```

`loading` defaults to `null` (render nothing while resolving). `fallback` defaults to `null`.

### 7. Package lives at `packages/react/`, not under `packages/adapters/`

The adapter pattern is for the DNA pipeline (input → DNA → output). A React component library is a UI runtime consumer, not a pipeline adapter. It would pull `react` into the adapter bundle for non-UI consumers. Standalone package keeps the dependency boundary clean.

## Risks / Trade-offs

- **Role resolution async waterfall** — if `resolveRoles` is slow, every `<Operation>` in the tree blocks in the loading state. Mitigation: roles are resolved once at `DnaProvider` mount and cached for the provider's lifetime; individual `<Operation>` components do not re-resolve.
- **`store` path ID mismatch** — if auth IDs differ from store instance IDs, the `store` shortcut silently returns no roles. Mitigation: documented clearly; `resolveRoles` is the safe path for any auth system with its own ID space.
- **`perform()` re-check latency** — re-resolving roles on every `perform()` call adds latency if `resolveRoles` is async. Mitigation: provider caches resolved roles; `perform()` reads from cache unless the cache is stale (role changes are rare within a session).
- **No RSC support** — context providers don't work in React Server Components. Mitigation: document that `<DnaProvider>` must be placed at a client boundary; common pattern for auth providers.

## Open Questions

- Should `DnaProvider` expose a `refresh()` method to re-resolve roles mid-session (e.g., after a role change)? Useful for long-lived sessions.
- Should `perform()` accept an optional `onSuccess` / `onError` callback, or rely entirely on the caller's `await` of the returned promise?
