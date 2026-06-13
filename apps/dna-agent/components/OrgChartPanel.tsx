'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { OrgChartViewModel, OrgChartNode } from '@dna-codes/dna-mcp'

interface OrgChartPanelProps {
  refreshSignal: number
}

const GROUP_TYPES = new Set(['company', 'department', 'domain', 'group'])
const isGroup = (node: OrgChartNode) => GROUP_TYPES.has(node.type.toLowerCase())

/**
 * Renders one node and its descendants top-down. Groups (company, department)
 * render as section headings; positions render as cards. Children — sub-groups,
 * top-level positions, and reports_to subordinates — all live on `node.reports`
 * and recurse one level deeper, so the visual nesting mirrors the org hierarchy:
 * company > department > position > position…
 */
function OrgNode({ node, depth }: { node: OrgChartNode; depth: number }) {
  const children = node.reports

  if (isGroup(node)) {
    return (
      <div style={{ marginBottom: 'var(--ui-space-3)' }}>
        <div style={{
          fontSize: depth === 0 ? '0.8rem' : '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: depth === 0 ? 'var(--ui-color-primary)' : 'var(--ui-color-text-muted)',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.25rem',
          marginBottom: '0.625rem',
        }}>
          {node.name}
        </div>
        <NestedChildren nodes={children} depth={depth + 1} />
      </div>
    )
  }

  // Position card
  return (
    <div>
      <div data-ui-card="" style={{ padding: 'var(--ui-space-2) var(--ui-space-3)', marginBottom: 'var(--ui-space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ui-space-2)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{node.name}</span>
          <span data-ui-badge="" style={{ flexShrink: 0 }}>{node.type}</span>
        </div>
        {node.holders.map(h => (
          <div key={h.id} style={{ fontSize: '0.75rem', color: 'var(--ui-color-primary)', marginTop: 'var(--ui-space-1)' }}>{h.name}</div>
        ))}
      </div>
      <NestedChildren nodes={children} depth={depth + 1} />
    </div>
  )
}

/** Indented, left-bordered container that guides the eye down each level of the hierarchy. */
function NestedChildren({ nodes, depth }: { nodes: OrgChartNode[]; depth: number }) {
  if (nodes.length === 0) return null
  return (
    <div style={{
      marginLeft: '0.5rem',
      paddingLeft: '0.75rem',
      borderLeft: '1px solid var(--border)',
    }}>
      {nodes.map(child => <OrgNode key={child.id} node={child} depth={depth} />)}
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
      {refreshing && (
        <span style={{ fontSize: '0.625rem', color: 'var(--primary)', animation: 'pulse 1s ease-in-out infinite', display: 'block', marginBottom: '0.5rem' }}>
          ◈ updating
          <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
        </span>
      )}
      {viewModel.roots.map(root => <OrgNode key={root.id} node={root} depth={0} />)}
    </div>
  )
}
