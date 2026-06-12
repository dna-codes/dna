'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { OrgChartViewModel, OrgChartNode } from '@dna-codes/dna-mcp'

interface OrgChartPanelProps {
  refreshSignal: number
}

function OrgNode({ node, depth = 0 }: { node: OrgChartNode; depth?: number }) {
  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : 0 }}>
      <div data-ui-card="" style={{ padding: 'var(--ui-space-2) var(--ui-space-3)', marginBottom: 'var(--ui-space-2)', gap: 'var(--ui-space-1)' }}>
        <span data-ui-tag="" data-variant="primary">{node.type}</span>
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{node.name}</span>
        {node.holders.map(h => (
          <span key={h.id} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {h.name}
          </span>
        ))}
      </div>
      {node.reports.length > 0 && (
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
          {node.reports.map(r => (
            <OrgNode key={r.id} node={r} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function OrgChartPanel({ refreshSignal }: OrgChartPanelProps) {
  const [viewModel, setViewModel] = useState<OrgChartViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFirstLoad = useRef(true)

  const fetchOrgChart = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lens/org-chart')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as OrgChartViewModel
      setViewModel(data)
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
      fetchOrgChart(false)
    } else {
      fetchOrgChart(true)
    }
  }, [fetchOrgChart, refreshSignal])

  if (loading) {
    return (
      <div style={{ padding: 'var(--ui-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
        {[1, 2, 3].map(i => <div key={i} data-ui-skeleton="" style={{ height: '3.5rem' }} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>
        Could not load org chart: {error}
      </div>
    )
  }

  if (!viewModel || viewModel.roots.length === 0) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No org chart data yet. Describe your organization to get started.
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <p style={{
        fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        {viewModel.groupName}
        {refreshing && (
          <span style={{ fontSize: '0.625rem', color: 'var(--primary)', animation: 'pulse 1s ease-in-out infinite' }}>
            ◈ updating
            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
          </span>
        )}
      </p>
      {viewModel.roots.map(root => (
        <OrgNode key={root.id} node={root} />
      ))}
    </div>
  )
}
