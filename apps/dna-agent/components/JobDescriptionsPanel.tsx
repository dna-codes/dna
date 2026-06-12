'use client'

import { useEffect, useState } from 'react'

interface Responsibility {
  title: string
  description?: string
}

interface JobDescEntry {
  positionId: string
  role: string
  description?: string
  holder?: string
  department?: string
  reportsTo?: string
  responsibilities: Responsibility[]
}

interface JobDescriptionsData {
  lens: string
  groupName: string
  entries: JobDescEntry[]
}

export function JobDescriptionsPanel({ refreshSignal }: { refreshSignal: number }) {
  const [data, setData] = useState<JobDescriptionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    fetch('/api/lens/job-descriptions')
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

  const entries = data?.entries ?? []

  if (entries.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No positions yet. Ask the agent to build your org structure.
      </div>
    )
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selected !== null) {
    const entry = entries[selected]
    return (
      <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
        <button
          onClick={() => setSelected(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
            marginBottom: '1rem', padding: 0,
          }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2L4 6l4 4" />
          </svg>
          All roles
        </button>

        <div style={{
          maxWidth: 480, margin: '0 auto',
          borderRadius: '0.75rem',
          background: 'var(--card-bg)',
          border: '1px solid rgba(13,148,136,0.3)',
          padding: '1rem',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                {entry.role}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                {entry.department && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {entry.department}
                  </span>
                )}
                {entry.reportsTo && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    · Reports to {entry.reportsTo}
                  </span>
                )}
              </div>
            </div>
            {entry.holder && (
              <span style={{
                flexShrink: 0,
                borderRadius: '9999px',
                background: 'rgba(13,148,136,0.15)',
                border: '1px solid rgba(13,148,136,0.3)',
                padding: '0.125rem 0.625rem',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
              }}>
                {entry.holder}
              </span>
            )}
          </div>

          {/* Description */}
          {entry.description && (
            <p style={{
              fontSize: '0.75rem', color: 'rgba(229,236,246,0.6)', lineHeight: 1.6,
              borderLeft: '2px solid rgba(13,148,136,0.4)', paddingLeft: '0.75rem',
              marginBottom: '0.875rem',
            }}>
              {entry.description}
            </p>
          )}

          {/* Responsibilities */}
          {entry.responsibilities.length > 0 ? (
            <div>
              <div style={{
                fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '0.625rem',
              }}>
                Key Responsibilities
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {entry.responsibilities.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.625rem' }}>
                    <span style={{
                      marginTop: '0.375rem', width: '0.375rem', height: '0.375rem',
                      borderRadius: '50%', background: 'rgba(13,148,136,0.6)', flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
                        {r.title}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.125rem' }}>
                          {r.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No responsibilities mapped.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
        Each role's responsibilities — derived from the DNA. Click to expand.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 480, margin: '0 auto' }}>
        {entries.map((entry, i) => (
          <button
            key={entry.positionId}
            onClick={() => setSelected(i)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              borderRadius: '0.75rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(13,148,136,0.4)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.95)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--card-bg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{entry.role}</span>
                {entry.holder && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {entry.holder}
                  </span>
                )}
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="rgba(13,148,136,0.6)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l5 5-5 5" />
              </svg>
            </div>
            {entry.responsibilities.length > 0 && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {entry.responsibilities.map(r => r.title).join(' · ')}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
