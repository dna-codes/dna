'use client'

import React, { useState } from 'react'
import { DnaProvider, Operation, useOperation } from '@dna-codes/dna-react'
import type { AuditEvent } from '@dna-codes/dna-react'
import type { OperationalDNA } from '@dna-codes/dna-core'
import { DEMO_USERS, type DemoUser } from '@/lib/demo-users'

// ── Types ─────────────────────────────────────────────────────────────────

type LogEntry = {
  id:        number
  layer:     'client' | 'server'
  operation: string
  permitted: boolean
  timestamp: string
  error?:    string
}

// ── Design tokens ─────────────────────────────────────────────────────────

const c = {
  bg:      '#0f172a',
  surface: '#1e293b',
  border:  '#334155',
  text:    '#e2e8f0',
  muted:   '#94a3b8',
  dim:     '#475569',
  client:  '#3b82f6',
  server:  '#a855f7',
  green:   '#22c55e',
  red:     '#f87171',
  code:    '#020817',
}

// ── Syntax highlighter ────────────────────────────────────────────────────

const KEYWORDS = new Set(['const', 'let', 'await', 'return', 'if', 'else', 'async', 'function', 'type', 'export', 'import', 'from', 'true', 'false', 'null'])

const tok = {
  comment:   '#546e7a',
  keyword:   '#c792ea',
  string:    '#c3e88d',
  component: '#f07178',
  tag:       '#89ddff',
  fn:        '#82aaff',
  number:    '#f78c6c',
  punct:     '#89ddff',
  plain:     '#94a3b8',
}

type TokType = keyof typeof tok

function tokenizeLine(line: string): Array<{ text: string; type: TokType }> {
  const out: Array<{ text: string; type: TokType }> = []
  let i = 0

  while (i < line.length) {
    // Inline comment
    if (line[i] === '/' && line[i + 1] === '/') {
      out.push({ text: line.slice(i), type: 'comment' })
      break
    }

    // String literals
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i]; let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++ }
      out.push({ text: line.slice(i, j + 1), type: 'string' }); i = j + 1
      continue
    }

    // JSX tags  <Component  </Component  <tag
    if (line[i] === '<') {
      const m = line.slice(i).match(/^<\/?[A-Za-z][A-Za-z0-9.]*/)
      if (m) {
        const isComponent = /^<\/?[A-Z]/.test(m[0])
        out.push({ text: m[0], type: isComponent ? 'component' : 'tag' })
        i += m[0].length; continue
      }
    }

    // Identifier / keyword / function call
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < line.length && /[\w$]/.test(line[j])) j++
      const word = line.slice(i, j)
      const type: TokType = KEYWORDS.has(word) ? 'keyword' : line[j] === '(' ? 'fn' : 'plain'
      out.push({ text: word, type }); i = j; continue
    }

    // Number
    if (/\d/.test(line[i])) {
      let j = i
      while (j < line.length && /[\d.]/.test(line[j])) j++
      out.push({ text: line.slice(i, j), type: 'number' }); i = j; continue
    }

    // Punctuation
    if (/[{}()[\],;=<>/!&|+\-*:.]/.test(line[i])) {
      out.push({ text: line[i], type: 'punct' }); i++; continue
    }

    out.push({ text: line[i], type: 'plain' }); i++
  }
  return out
}

function Highlight({ code }: { code: string }) {
  return (
    <>
      {code.split('\n').map((line, i) => (
        <div key={i}>
          {line === ''
            ? <span>&nbsp;</span>
            : tokenizeLine(line).map((t, j) => (
              <span key={j} style={{ color: tok[t.type] }}>{t.text}</span>
            ))
          }
        </div>
      ))}
    </>
  )
}

// ── Code snippets ─────────────────────────────────────────────────────────

const CLIENT_SNIPPET = `// Gate — renders greyed label if role not allowed,
// active button if permitted
<Operation name="Loan.Approve"
  fallback={<span style={{ color: '#475569' }}>Approve</span>}
>
  <button onClick={handleClick}>Approve</button>
</Operation>

// perform() — fires onAudit, then POST to server
const { perform } = useOperation('Loan.Approve')
await perform({ loanId })
await fetch('/api/operations/Loan.Approve', { method: 'POST', ... })`

const SERVER_SNIPPET = `// middleware/dnaAuth.ts
// Runs before every /api/operations/* request
export async function dnaAuth(request, { params }) {
  const { userId, roles } = await request.json()
  const permitted = checkPermitted(params.name, roles)

  // Authoritative audit — always fires, client gate not trusted
  auditLog({ operation: params.name, userId, permitted })

  if (!permitted)
    return Response.json({ permitted: false }, { status: 403 })
}`

function CodePeek({ label, badgeColor, badgeTextColor = '#fff', badgeLabel, code }: {
  label: string; badgeColor: string; badgeTextColor?: string; badgeLabel: string; code: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.6rem', borderRadius: 5, cursor: 'pointer',
          background: c.surface, border: `1px solid ${c.border}`,
          color: c.text, fontSize: '0.72rem', fontFamily: 'monospace',
        }}
      >
        <span style={{ color: c.muted }}>{open ? '▾' : '▸'}</span>
        <Badge color={badgeColor} textColor={badgeTextColor} label={badgeLabel} />
        <span>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: c.dim }}>{open ? 'collapse' : 'view code'}</span>
      </button>
      {open && (
        <pre style={{ margin: '0.4rem 0 0', padding: '0.75rem', background: c.code, borderRadius: 6, fontSize: '0.7rem', overflowX: 'auto', lineHeight: 1.7, border: `1px solid ${c.border}` }}>
          <Highlight code={code} />
        </pre>
      )}
    </div>
  )
}

// ── Operation button ───────────────────────────────────────────────────────

function LoanActionButton({ opName, label, loanId, userId, roles, onServerLog }: {
  opName: string; label: string; loanId: string
  userId: string; roles: string[]
  onServerLog: (e: Omit<LogEntry, 'id'>) => void
}) {
  const { perform } = useOperation(opName)
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    await perform({ loanId })
    try {
      const res = await fetch(`/api/operations/${encodeURIComponent(opName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roles, payload: { loanId } }),
      })
      const data = await res.json()
      onServerLog({ layer: 'server', operation: opName, permitted: data.permitted, timestamp: new Date().toISOString() })
    } catch (err) {
      onServerLog({ layer: 'server', operation: opName, permitted: false, timestamp: new Date().toISOString(), error: String(err) })
    }
    setBusy(false)
  }

  return (
    <button onClick={handleClick} disabled={busy} style={{
      padding: '0.35rem 0.8rem', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer',
      border: `1px solid ${c.border}`, background: c.surface, color: c.text,
    }}>
      {busy ? '…' : label}
    </button>
  )
}

// ── Loan card ──────────────────────────────────────────────────────────────

const OPERATIONS = [
  { name: 'Loan.Apply',    label: 'Apply',    allowedRole: 'Borrower'       },
  { name: 'Loan.Approve',  label: 'Approve',  allowedRole: 'Underwriter'    },
  { name: 'Loan.Disburse', label: 'Disburse', allowedRole: 'LendingManager' },
]

function LoanCard({ loanId, user, bypassGate, onServerLog }: {
  loanId: string; user: DemoUser; bypassGate: boolean
  onServerLog: (e: Omit<LogEntry, 'id'>) => void
}) {
  return (
    <div style={{ border: `1px solid ${c.border}`, borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '0.5rem', background: c.surface }}>
      <div style={{ fontSize: '0.75rem', color: c.muted, marginBottom: '0.5rem' }}>Loan #{loanId}</div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {OPERATIONS.map(op => (
          bypassGate
            ? <LoanActionButton key={op.name} opName={op.name} label={op.label} loanId={loanId} userId={user.id} roles={user.roles} onServerLog={onServerLog} />
            : <Operation key={op.name} name={op.name} fallback={<span style={{ color: c.dim, fontSize: '0.78rem' }}>{op.label}</span>}>
                <LoanActionButton opName={op.name} label={op.label} loanId={loanId} userId={user.id} roles={user.roles} onServerLog={onServerLog} />
              </Operation>
        ))}
      </div>
    </div>
  )
}

// ── Audit log ──────────────────────────────────────────────────────────────

function Badge({ color, textColor = '#fff', label }: { color: string; textColor?: string; label: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: color, color: textColor, flexShrink: 0, letterSpacing: '0.03em' }}>
      {label}
    </span>
  )
}

function AuditLog({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: c.muted }}>Audit log</span>
        {entries.length > 0 && (
          <button onClick={onClear} style={{ fontSize: '0.7rem', color: c.dim, background: 'none', border: 'none', cursor: 'pointer' }}>clear</button>
        )}
      </div>

      <div style={{ background: c.code, borderRadius: 6, padding: '0.6rem', minHeight: 72, maxHeight: 240, overflowY: 'auto', border: `1px solid ${c.border}` }}>
        {entries.length === 0
          ? <span style={{ color: c.dim, fontSize: '0.72rem', fontFamily: 'monospace' }}>Click an action to see audit events…</span>
          : [...entries].reverse().map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', fontSize: '0.72rem', padding: '0.25rem 0', borderBottom: `1px solid #0f172a` }}>
              <Badge color={e.layer === 'client' ? '#475569' : '#94a3b8'} textColor={e.layer === 'client' ? '#fff' : '#1e293b'} label={e.layer === 'client' ? 'CLIENT' : 'SERVER'} />
              <span style={{ color: e.permitted ? c.green : c.red }}>{e.permitted ? '✅' : '🚫'} {e.operation}</span>
              {e.error && <span style={{ color: c.red, fontSize: '0.65rem' }}>({e.error})</span>}
              <span style={{ color: c.dim, marginLeft: 'auto' }}>{e.timestamp.slice(11, 19)}</span>
            </div>
          ))
        }
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
        <CodePeek label="client gate + perform()" badgeColor="#475569" badgeLabel="CLIENT" code={CLIENT_SNIPPET} />
        <CodePeek label="server middleware" badgeColor="#94a3b8" badgeTextColor="#1e293b" badgeLabel="SERVER" code={SERVER_SNIPPET} />
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────

let nextId = 1

export function LoanDashboard({ dna }: { dna: OperationalDNA }) {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0])
  const [log, setLog]                 = useState<LogEntry[]>([])
  const [bypassGate, setBypassGate]   = useState(false)

  function addLog(entry: Omit<LogEntry, 'id'>) {
    setLog(prev => [...prev, { ...entry, id: nextId++ }])
  }

  function clientAuditSink(event: AuditEvent) {
    addLog({ layer: 'client', operation: event.operation, permitted: event.permitted, timestamp: event.timestamp })
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '2rem auto', padding: '0 1rem', color: c.text, background: c.bg, minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem', paddingTop: '2rem' }}>DNA Authorization and Audit (React)</h1>
      <p style={{ fontSize: '0.78rem', color: c.muted, marginBottom: '1.5rem' }}>
        Switch users to change access. Greyed labels = no permission. Each click fires a client pre-flight then a server enforcement call.
      </p>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {DEMO_USERS.map(u => (
          <button key={u.id} onClick={() => setCurrentUser(u)} style={{
            padding: '0.3rem 0.75rem', borderRadius: 9999, fontSize: '0.78rem', cursor: 'pointer',
            border: `1px solid ${u.id === currentUser.id ? c.client : c.border}`,
            background: u.id === currentUser.id ? '#1e3a5f' : c.surface,
            color: u.id === currentUser.id ? '#93c5fd' : c.muted,
            fontWeight: u.id === currentUser.id ? 600 : 400,
          }}>
            {u.name}
          </button>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: c.muted, cursor: 'pointer', marginBottom: '1rem', userSelect: 'none' }}>
        <input type="checkbox" checked={bypassGate} onChange={e => setBypassGate(e.target.checked)} />
        Bypass client gate
        <span style={{ color: c.dim }}>— show all buttons; server still enforces</span>
      </label>

      <DnaProvider key={currentUser.id} dna={dna} userId={currentUser.id} roles={currentUser.roles} onAudit={clientAuditSink}>
        <LoanCard loanId="LOAN-001" user={currentUser} bypassGate={bypassGate} onServerLog={addLog} />
        <LoanCard loanId="LOAN-002" user={currentUser} bypassGate={bypassGate} onServerLog={addLog} />
      </DnaProvider>

      <div style={{ marginTop: '1.25rem' }}>
        <AuditLog entries={log} onClear={() => setLog([])} />
      </div>
    </div>
  )
}
