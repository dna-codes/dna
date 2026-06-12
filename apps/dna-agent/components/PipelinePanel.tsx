'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { PipelineViewModel, PipelineOpportunity } from '@dna-codes/dna-mcp'

interface PipelinePanelProps {
  refreshSignal: number
}

function OppCard({ opp }: { opp: PipelineOpportunity }) {
  return (
    <div data-ui-card="" style={{ padding: 'var(--ui-space-2) var(--ui-space-3)', gap: 'var(--ui-space-1)', display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontWeight: 'var(--ui-font-weight-semibold)', fontSize: 'var(--ui-font-size-sm)' }}>{opp.name}</span>
      {opp.account && <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-primary)' }}>{opp.account}</span>}
      {opp.assignedTo && <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>Rep: {opp.assignedTo}</span>}
      {opp.deal && <span data-ui-badge="" data-variant="success" style={{ alignSelf: 'flex-start', textTransform: 'none' }}>→ {opp.deal}</span>}
    </div>
  )
}

function Column({ title, items, accent }: { title: string; items: PipelineOpportunity[]; accent: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        paddingBottom: '0.5rem', borderBottom: `1px solid ${accent}`,
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
          {title}
        </span>
        <span style={{
          fontSize: '0.625rem', fontWeight: 700,
          background: 'rgba(30,41,59,0.8)', border: '1px solid var(--border)',
          borderRadius: '9999px', padding: '0.1em 0.5em',
          color: 'var(--text-muted)',
        }}>
          {items.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', overflowY: 'auto' }}>
        {items.length === 0 ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
        ) : (
          items.map(o => <OppCard key={o.id} opp={o} />)
        )}
      </div>
    </div>
  )
}

export function PipelinePanel({ refreshSignal }: PipelinePanelProps) {
  const [viewModel, setViewModel] = useState<PipelineViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFirstLoad = useRef(true)

  const fetchPipeline = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lens/pipeline')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setViewModel(await res.json() as PipelineViewModel)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      fetchPipeline(false)
    } else {
      fetchPipeline(true)
    }
  }, [fetchPipeline, refreshSignal])

  if (loading) {
    return (
      <div style={{ padding: 'var(--ui-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
        {[1, 2, 3].map(i => <div key={i} data-ui-skeleton="" style={{ height: '3.5rem' }} />)}
      </div>
    )
  }

  if (error) {
    return <div style={{ padding: '1rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>Could not load pipeline: {error}</div>
  }

  if (!viewModel || (viewModel.open.length === 0 && viewModel.closed.length === 0)) {
    return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pipeline data yet. Describe your accounts and opportunities to get started.</div>
  }

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pipeline</span>
        {refreshing && (
          <span style={{ fontSize: '0.625rem', color: 'var(--primary)', animation: 'pulse 1s ease-in-out infinite' }}>
            ◈ updating
            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden' }}>
        <Column title="Open" items={viewModel.open} accent="var(--primary)" />
        <Column title="Closed" items={viewModel.closed} accent="rgba(52,211,153,0.7)" />
      </div>
    </div>
  )
}
