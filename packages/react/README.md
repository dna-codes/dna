# `@dna-codes/dna-react`

React bindings for DNA — authorization gates, audit capture, and feature flag integration driven by your operational DNA document.

## Installation

```bash
npm install @dna-codes/dna-react
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick start

```tsx
import { DnaProvider, Operation, useOperation } from '@dna-codes/dna-react'
import operationalDna from './dna/lending/operational.json'

function App() {
  return (
    <DnaProvider
      dna={operationalDna}
      userId="alice"
      roles={["Underwriter"]}
      onAudit={event => console.log(event)}
    >
      <LoanActions />
    </DnaProvider>
  )
}

// Declarative gate — renders children only if the current user is permitted
function LoanActions() {
  return (
    <Operation name="Loan.Approve" fallback={<span>No access</span>}>
      <ApproveButton />
    </Operation>
  )
}

// Imperative hook — for perform() and direct permitted checks
function ApproveButton() {
  const { permitted, perform } = useOperation('Loan.Approve')

  async function handleClick() {
    const { permitted } = await perform({ loanId: 'LOAN-001' })
    if (!permitted) return
    // call your API here
  }

  return <button onClick={handleClick} disabled={!permitted}>Approve</button>
}
```

## API

### `<DnaProvider>`

Context root. All `<Operation>` and `useOperation` calls must be descendants.

| Prop | Type | Required | Description |
|---|---|---|---|
| `dna` | `OperationalDNA` | ✓ | The operational DNA document |
| `userId` | `string` | ✓ | Current user's identifier |
| `roles` | `string[]` | one of three | Pre-resolved role names (sync, SSR-safe) |
| `resolveRoles` | `(userId) => Promise<string[]>` | one of three | Async role resolver (bridges any auth system) |
| `store` | `DnaDataStore` | one of three | Resolve roles via link traversal |
| `onAudit` | `(event: AuditEvent) => void` | | Audit sink — called on every `perform()`, fire-and-forget |
| `flags` | `(opName: string) => boolean \| Promise<boolean>` | | Feature flag resolver |

### `<Operation>`

Declarative rendering gate. Renders `children` when the current user is permitted **and** the flag resolver returns `true`. Renders `fallback` otherwise.

```tsx
<Operation
  name="Loan.Approve"
  fallback={<span>No access</span>}
  loading={<Skeleton />}
>
  <ApproveButton />
</Operation>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | required | Operation name (e.g. `"Loan.Approve"`) |
| `fallback` | `ReactNode` | `null` | Rendered when gate is closed |
| `loading` | `ReactNode` | `null` | Rendered while roles or flags are resolving |

### `useOperation(name)`

Imperative hook. Returns `{ permitted, perform }`.

```tsx
const { permitted, perform } = useOperation('Loan.Approve')

// Check permission directly
if (!permitted) return null

// Call perform() when the user acts — fires audit before returning
const { permitted } = await perform({ loanId })
```

- **`permitted`** — reactive boolean. `true` when the current user has an allowed role.
- **`perform(payload?)`** — re-checks permission, fires `onAudit`, returns `Promise<{ permitted: boolean }>`.

### `AuditEvent`

Emitted by `perform()` to the `onAudit` sink.

```ts
type AuditEvent = {
  operation: string    // "Loan.Approve"
  resource:  string    // "Loan"
  action:    string    // "Approve"
  userId:    string
  timestamp: string    // ISO 8601
  permitted: boolean
  payload?:  unknown   // value passed to perform()
}
```

## Two-gate model

`<Operation>` combines two independent gates:

| Gate | Source | Closed when |
|---|---|---|
| Permission | DNA access rules + resolved roles | user's roles not in the allow list |
| Feature flag | `flags` resolver | resolver returns `false` |

Both must be open for children to render.

## Audit

`onAudit` is fire-and-forget. The sink receives every `perform()` call — permitted and blocked alike. Errors thrown by the sink are swallowed. Use this for UI analytics or console logging; authoritative audit logs should be written server-side when your API validates the operation.

## Example app

See [`examples/react-app/`](../../examples/react-app/) for a Vite + React demo using the lending DNA with a user-switcher and mock API.
