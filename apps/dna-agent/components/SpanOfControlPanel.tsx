'use client'

import { useEffect, useState, useCallback } from 'react'

interface SpanEntry {
  id: string
  name: string
  directReports: number
  totalReports: number
}

interface SpanOfControlData {
  positions: SpanEntry[]
}

export function SpanOfControlPanel({ refreshSignal }: { refreshSignal: number }) {
  const [data, setData] = useState<SpanOfControlData>({ positions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lens/span-of-control')
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
  if (error) return <div style={{ padding: '1rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>Could not load span of control: {error}</div>
  if (data.positions.length === 0) {
    return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No positions yet.</div>
  }

  const sorted = [...data.positions].sort((a, b) => b.totalReports - a.totalReports)

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr>
            <Th>Position</Th>
            <Th align="right">Direct</Th>
            <Th align="right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.id}>
              <Td>{p.name}</Td>
              <Td align="right">{p.directReports}</Td>
              <Td align="right">
                <span style={{ color: p.totalReports > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {p.totalReports}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{ textAlign: align, padding: '0.375rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td style={{ textAlign: align, padding: '0.375rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {children}
    </td>
  )
}

function PulseLoader() {
  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: '2rem', borderRadius: '0.375rem', background: 'rgba(30,41,59,0.6)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )
}
