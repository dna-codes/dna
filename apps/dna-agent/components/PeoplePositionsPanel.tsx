'use client'

import { useEffect, useState, useCallback } from 'react'

interface PositionEntry {
  id: string
  name: string
  person: string | null
}

interface PeoplePositionsData {
  positions: PositionEntry[]
}

const emptyState: PeoplePositionsData = { positions: [] }

export function PeoplePositionsPanel({ refreshSignal }: { refreshSignal: number }) {
  const [data, setData] = useState<PeoplePositionsData>(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lens/people-positions')
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
  if (error) return <ErrorMsg msg={error} label="people/positions" />
  if (data.positions.length === 0) {
    return <Empty msg="No positions yet. Ask the agent to set up your org structure." />
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr>
            <Th>Position</Th>
            <Th>Person</Th>
          </tr>
        </thead>
        <tbody>
          {data.positions.map(p => (
            <tr key={p.id}>
              <Td>{p.name}</Td>
              <Td>
                {p.person
                  ? <span style={{ color: 'var(--primary)' }}>{p.person}</span>
                  : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Vacant</span>
                }
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '0.375rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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

function ErrorMsg({ msg, label }: { msg: string; label: string }) {
  return <div style={{ padding: '1rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>Could not load {label}: {msg}</div>
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{msg}</div>
}
