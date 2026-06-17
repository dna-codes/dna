'use client'

import { useEffect, useState } from 'react'

type PackName = 'operational' | 'crm' | 'hr'
type SessionMode = 'build' | 'operate'

interface ExampleOrg { id: string; label: string; domain: string; description: string }

const PACKS: { name: PackName; label: string; description: string }[] = [
  { name: 'operational', label: 'Operational', description: 'Org structure, reporting chains, and workflows.' },
  { name: 'crm', label: 'CRM', description: 'Sales pipelines and customer accounts.' },
  { name: 'hr', label: 'HR', description: 'People-ops, headcount, and recruitment.' },
]

interface SessionSetupModalProps {
  onComplete: (pack: PackName, mode: SessionMode, exampleId?: string) => Promise<void>
}

/**
 * One scannable list of starting points — click a card to start. An example loads
 * a full graph and opens in Operate; a blank pack opens in Build. Mode is still
 * switchable from the header toggle afterward, so it isn't asked here.
 */
export function SessionSetupModal({ onComplete }: SessionSetupModalProps) {
  const [examples, setExamples] = useState<ExampleOrg[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/examples')
      .then((r) => (r.ok ? r.json() : { examples: [] }))
      .then((d) => setExamples(d.examples ?? []))
      .catch(() => setExamples([]))
  }, [])

  async function start(key: string, pack: PackName, mode: SessionMode, exampleId?: string) {
    setBusy(key)
    setError('')
    try {
      await onComplete(pack, mode, exampleId)
    } catch (e) {
      setError(String(e))
      setBusy(null)
    }
  }

  function Choice({
    chosenKey, title, badge, badgeVariant, description, onClick,
  }: {
    chosenKey: string; title: string; badge: string; badgeVariant?: string; description: string; onClick: () => void
  }) {
    const loading = busy === chosenKey
    return (
      <button
        data-ui-card=""
        disabled={busy !== null}
        onClick={onClick}
        style={{
          textAlign: 'left', cursor: busy ? 'default' : 'pointer', width: '100%',
          padding: 'var(--ui-space-3) var(--ui-space-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)',
          opacity: busy && !loading ? 0.5 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <span style={{ fontSize: 'var(--ui-font-size-sm)', fontWeight: 'var(--ui-font-weight-semibold)' }}>{title}</span>
          <span data-ui-tag="" data-variant={badgeVariant}>{badge}</span>
          {loading && <span data-ui-badge="" style={{ marginLeft: 'auto' }}>Loading…</span>}
        </div>
        <p style={{ margin: 0, fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>{description}</p>
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'var(--ui-color-overlay)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--ui-space-4)',
    }}>
      <div data-ui-card="" style={{ width: '100%', maxWidth: 460 }}>
        <div data-ui-card-header="">
          <h2 data-ui-card-title="" style={{ fontSize: 'var(--ui-font-size-md)' }}>Start a new session</h2>
          <p data-ui-card-description="">Pick a starting point.</p>
        </div>

        <div data-ui-card-body="" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
          {examples.map((ex) => (
            <Choice
              key={ex.id}
              chosenKey={`ex:${ex.id}`}
              title={ex.label}
              badge={`${ex.domain} example`}
              badgeVariant="primary"
              description={ex.description}
              onClick={() => start(`ex:${ex.id}`, 'operational', 'operate', ex.id)}
            />
          ))}

          {examples.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)', margin: 'var(--ui-space-1) 0', color: 'var(--ui-color-text-subtle)', fontSize: 'var(--ui-font-size-xs)' }}>
              <span data-ui-separator="" style={{ flex: 1 }} /> or start blank <span data-ui-separator="" style={{ flex: 1 }} />
            </div>
          )}

          {PACKS.map((p) => (
            <Choice
              key={p.name}
              chosenKey={`pack:${p.name}`}
              title={p.label}
              badge="blank"
              description={p.description}
              onClick={() => start(`pack:${p.name}`, p.name, 'build')}
            />
          ))}

          {error && (
            <div style={{
              fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-danger)',
              padding: 'var(--ui-space-2) var(--ui-space-3)',
              background: 'rgb(251 113 133 / 0.08)',
              borderRadius: 'var(--ui-radius-md)',
              border: '1px solid rgb(251 113 133 / 0.2)',
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
