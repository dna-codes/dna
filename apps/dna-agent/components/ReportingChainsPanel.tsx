'use client'

import { useEffect, useState, useCallback } from 'react'

interface ReportingChainsData {
  chains: string[][]
}

export function ReportingChainsPanel({ refreshSignal }: { refreshSignal: number }) {
  const [data, setData] = useState<ReportingChainsData>({ chains: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lens/reporting-chains')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_, refreshSignal])

  if (loading) return <PulseLoader />
  if (error) return <div style={{ padding: '1rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>Could not load reporting chains: {error}</div>
  if (data.chains.length === 0) {
    return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No reporting relationships yet.</div>
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.chains.map((chain, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.25rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
          }}
        >
          {chain.map((name, j) => (
            <span key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8125rem', color: j === chain.length - 1 ? 'var(--primary)' : 'var(--text)' }}>
                {name}
              </span>
              {j < chain.length - 1 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function PulseLoader() {
  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(30,41,59,0.6)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )
}
