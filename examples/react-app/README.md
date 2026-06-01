# DNA React Example — Loan Dashboard

Demonstrates `@dna-codes/dna-react` with a Next.js app: client-side permission gates, server-side enforcement, and a unified audit log.

## What it shows

- **`<Operation>`** — renders a greyed label instead of a button when the current user lacks the required role
- **`useOperation`** — `perform()` fires the client audit, then a server POST enforces the rule independently
- **Two-layer auth** — client gate is a UX shortcut; the server never trusts it
- **Bypass toggle** — shows all buttons regardless of client permission, proving the server still blocks unauthorized calls
- **Audit log** — CLIENT and SERVER events appear in real time with timestamps; expand the code snippets to see the actual patterns in use

## Install

```bash
cd examples/react-app
npm install
```

> Requires Node 18+. Packages are installed from npm (`@dna-codes/dna-core` and `@dna-codes/dna-react` are published — not workspace-linked).

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo users

| User | Role | Permitted operations |
|---|---|---|
| Alice (Borrower) | `Borrower` | Loan.Apply |
| Bob (Underwriter) | `Underwriter` | Loan.Approve |
| Carol (Manager) | `LendingManager` | Loan.Disburse |

Switch users with the pill buttons at the top. Each user can only click their own action; the others appear greyed out.

## Things to try

1. **Switch users** — notice which buttons are active vs greyed
2. **Click an active button** — watch CLIENT then SERVER entries appear in the audit log
3. **Enable "Bypass client gate"** — all buttons become clickable regardless of role
4. **Click a disallowed action with bypass on** — CLIENT shows `✅` (perform() fires unconditionally), SERVER shows `🚫` (server still enforces)
5. **Expand the CLIENT / SERVER code snippets** — see the actual `<Operation>` and middleware patterns

## Architecture

```
Browser                              Server
───────────────────────────────────  ──────────────────────────────────
DnaProvider (roles injected)
  └─ <Operation name="Loan.Approve"> → greyed label if role missing
       └─ <button onClick>
            └─ perform({ loanId })   → fires onAudit (client)
            └─ POST /api/operations/Loan.Approve
                                     → checkPermitted(opName, roles)
                                     → server audit log (console)
                                     → 403 if blocked
```

The server route re-derives permissions from the same operational DNA — it never trusts the client gate.

## Key files

| File | Purpose |
|---|---|
| `components/LoanDashboard.tsx` | Main UI — provider setup, loan cards, audit log |
| `lib/demo-users.ts` | Demo user list with roles |
| `app/api/operations/[name]/route.ts` | Server enforcement route |
| `app/page.tsx` | Page entry — loads lending DNA, renders dashboard |
