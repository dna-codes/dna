'use client'

import { useEffect, useState } from 'react'
import { type TypeRegistryData, type TypeNode, stabilityColor } from './TypeRegistryShared'

function StabilityBadge({ stability }: { stability: string }) {
  const c = stabilityColor(stability)
  return (
    <span style={{
      flexShrink: 0, borderRadius: '9999px',
      background: c.bg, border: `1px solid ${c.border}`,
      padding: '0.125rem 0.625rem',
      fontSize: '0.6875rem', fontWeight: 600, color: c.fg,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {stability}
    </span>
  )
}

export function TypeJobDescriptionsPanel({ refreshSignal }: { refreshSignal: number }) {
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

  const types = data?.resourceTypes ?? []
  const rels = data?.relationshipTypes ?? []

  if (types.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No types defined yet. Ask the agent to model your grammar.
      </div>
    )
  }

  function relsFor(typeName: string) {
    const outgoing = rels.filter(r => r.from === typeName)
    const incoming = rels.filter(r => r.to === typeName)
    return { outgoing, incoming }
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
        Definition of each type — attributes, maturity, and how it connects.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 520, margin: '0 auto' }}>
        {types.map((t: TypeNode) => {
          const { outgoing, incoming } = relsFor(t.name)
          return (
            <div key={t.name} style={{
              borderRadius: '0.75rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              padding: '0.875rem 1rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'ui-monospace, monospace' }}>
                    {t.name}
                  </span>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t.category}
                  </span>
                </div>
                <StabilityBadge stability={t.stability} />
              </div>

              {t.description && (
                <p style={{
                  fontSize: '0.75rem', color: 'rgba(229,236,246,0.6)', lineHeight: 1.6,
                  borderLeft: '2px solid rgba(13,148,136,0.4)', paddingLeft: '0.75rem',
                  margin: '0 0 0.75rem',
                }}>
                  {t.description}
                </p>
              )}

              {/* Attributes */}
              <div style={{ marginBottom: '0.625rem' }}>
                <div style={sectionLabel}>Attributes</div>
                {t.attributes.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {t.attributes.map(a => (
                      <span key={a.name} style={fieldChip} title={a.required ? 'required' : 'optional'}>
                        {a.name}
                        <span style={{ color: 'var(--text-muted)' }}> · {a.type}{a.required ? ' *' : ''}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No attributes defined.</span>
                )}
              </div>

              {/* Relationships */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {outgoing.length > 0 && (
                  <div>
                    <div style={sectionLabel}>Outgoing</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {outgoing.map(r => (
                        <span key={r.name} style={relChip}>
                          {r.name} <span style={{ color: 'var(--text-muted)' }}>→ {r.to}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {incoming.length > 0 && (
                  <div>
                    <div style={sectionLabel}>Incoming</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {incoming.map(r => (
                        <span key={r.name} style={relChip}>
                          <span style={{ color: 'var(--text-muted)' }}>{r.from} →</span> {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary)',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem',
}

const fieldChip: React.CSSProperties = {
  fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text)',
  background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)',
  borderRadius: '0.375rem', padding: '0.125rem 0.5rem',
}

const relChip: React.CSSProperties = {
  fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text)',
  background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)',
  borderRadius: '0.375rem', padding: '0.125rem 0.5rem',
}
