'use client'

import { useEffect, useState } from 'react'
import { type TypeRegistryData, REPORTS_TO_NAMES } from './TypeRegistryShared'

export function TypeReportingChainsPanel({ refreshSignal }: { refreshSignal: number }) {
  const [data, setData] = useState<TypeRegistryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/lens/type-registry')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshSignal])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Loading…
      </div>
    )
  }

  const rels = data?.relationshipTypes ?? []
  // reports_to-style relationship types: the named reporting relations, plus any
  // whose name mentions "report".
  const reporting = rels.filter(r => REPORTS_TO_NAMES.has(r.name) || /report/i.test(r.name))

  if (reporting.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem', textAlign: 'center' }}>
        No reporting relationship types defined yet. Add a <code style={{ margin: '0 0.25rem' }}>reports_to</code> type in Build mode.
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
        Reporting relationships in the grammar — which types report to which.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 480, margin: '0 auto' }}>
        {reporting.map(r => (
          <div key={r.name} style={{
            borderRadius: '0.75rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            padding: '0.75rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
              <span>{r.from}</span>
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="rgba(13,148,136,0.7)" strokeWidth="1.5">
                <path d="M1 6h16M13 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{r.to}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--primary)' }}>{r.name}</span>
            </div>
            {r.description && (
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {r.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
