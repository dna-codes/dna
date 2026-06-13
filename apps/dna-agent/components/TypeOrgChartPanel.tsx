'use client'

import { useEffect, useState } from 'react'
import { type TypeRegistryData, type TypeEdge, BELONGS_TO_NAMES, REPORTS_TO_NAMES } from './TypeRegistryShared'

interface TreeNode { name: string; category: string; children: TreeNode[]; reportsTo: string[] }

function buildHierarchy(types: { name: string; category: string }[], rels: TypeEdge[]) {
  // Only concrete belongs_to edges define a type-level spine. Packs often declare
  // belongs_to as a wildcard (`*→*`) whose real containment lives in instance
  // links, not the type — those can't nest types, so they fall through to the
  // category grouping below.
  const concrete = (r: TypeEdge) => r.from !== '*' && r.to !== '*'
  const belongsTo = rels.filter(r => BELONGS_TO_NAMES.has(r.name) && concrete(r))
  const reportsTo = rels.filter(r => REPORTS_TO_NAMES.has(r.name) && concrete(r))

  // reports_to annotations: from-type → [to-types]
  const reportsMap = new Map<string, string[]>()
  for (const r of reportsTo) {
    const list = reportsMap.get(r.from) ?? []
    list.push(r.to)
    reportsMap.set(r.from, list)
  }

  // belongs_to: from is contained by to → to is parent of from
  const childrenOf = new Map<string, string[]>()
  const isChild = new Set<string>()
  for (const r of belongsTo) {
    const kids = childrenOf.get(r.to) ?? []
    kids.push(r.from)
    childrenOf.set(r.to, kids)
    isChild.add(r.from)
  }

  const byName = new Map(types.map(t => [t.name, t]))

  function node(name: string, seen: Set<string>): TreeNode {
    const t = byName.get(name)
    const kids = (childrenOf.get(name) ?? []).filter(k => !seen.has(k))
    return {
      name,
      category: t?.category ?? '',
      reportsTo: reportsMap.get(name) ?? [],
      children: kids.map(k => node(k, new Set([...seen, k]))),
    }
  }

  // Roots: types never contained by a belongs_to edge.
  const roots = types.filter(t => !isChild.has(t.name)).map(t => node(t.name, new Set([t.name])))
  return { roots, hasStructure: belongsTo.length > 0 }
}

function NodeRow({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginLeft: depth * 18,
        padding: '0.4rem 0.625rem',
        borderRadius: '0.5rem',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderLeft: depth > 0 ? '2px solid rgba(13,148,136,0.4)' : '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
          {node.name}
        </span>
        <span style={{ fontSize: '0.625rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {node.category}
        </span>
        {node.reportsTo.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            reports to {node.reportsTo.join(', ')}
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.375rem' }}>
          {node.children.map(c => <NodeRow key={c.name} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

export function TypeOrgChartPanel({ refreshSignal }: { refreshSignal: number }) {
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

  const { roots, hasStructure } = buildHierarchy(types, rels)

  // Fallback: no belongs_to spine → group types by category.
  if (!hasStructure) {
    const byCategory = new Map<string, typeof types>()
    for (const t of types) {
      const list = byCategory.get(t.category) ?? []
      list.push(t)
      byCategory.set(t.category, list)
    }
    return (
      <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
          No containment defined yet — types grouped by category.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480, margin: '0 auto' }}>
          {[...byCategory.entries()].map(([cat, list]) => (
            <div key={cat}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {list.map(t => (
                  <span key={t.name} style={{
                    fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', color: 'var(--text)',
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    borderRadius: '0.5rem', padding: '0.25rem 0.625rem',
                  }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
        Structural spine of the grammar — how types contain one another.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxWidth: 520, margin: '0 auto' }}>
        {roots.map(r => <NodeRow key={r.name} node={r} depth={0} />)}
      </div>
    </div>
  )
}
