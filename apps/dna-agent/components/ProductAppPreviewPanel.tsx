'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { DnaProvider, Surface, Operation } from '@dna-codes/dna-react'
import type { OperationalDNA } from '@dna-codes/dna-core'
import type { ProductAppPreviewViewModel, PreviewNode, OperationAllow, SurfaceRecords } from '@dna-codes/dna-mcp'
import { Machine, useMachineState, setup, assign } from '@dna/ui-library'

/**
 * App Preview — a JSON-driven renderer for the materialized Product-UI graph.
 *
 * The lens hands us the nodes as JSON (App → Module → Workflow → Page → Section →
 * Component). We render a simple app shell — a sidebar that lists the App's pages
 * (grouped by Module) and a content pane that renders the selected Page. Each
 * Component node is mapped to a `@dna/ui-library` element by its `uiType` via
 * COMPONENTS below; an unmapped type renders a labeled placeholder. All styling
 * is the ui-library `data-ui-*` skin + `--ui-*` tokens.
 */

// `@dna/ui-library` types against React 19; this app pins React 18. Re-type the
// headless Machine parts against the app's React (behaviour is identical).
type NavEvent = { type: 'NAVIGATE'; pageId: string }
const MRoot = Machine.Root as unknown as (p: { machine?: unknown; children?: ReactNode; style?: CSSProperties }) => ReactNode
const MSend = Machine.Send as unknown as (p: { event: NavEvent; children?: ReactNode; style?: CSSProperties } & Record<string, unknown>) => ReactNode

const AUTHOR_BYPASS = '__all__'
const EMPTY_DNA = { rules: [] } as unknown as OperationalDNA

const navMachine = setup({
  types: { context: {} as { pageId: string | null }, events: {} as NavEvent },
}).createMachine({
  id: 'app-preview-nav',
  context: { pageId: null },
  on: { NAVIGATE: { actions: assign({ pageId: ({ event }) => event.pageId }) } },
})

function synthesizeDna(allows: OperationAllow[]): OperationalDNA {
  const rules = allows.map((a, i) => ({
    id: String(i), type: 'rule', version: '1', name: `${a.operation}-${a.role}`,
    operation: a.operation, rule_type: 'access', allow: [{ role: a.role }],
  }))
  return { rules } as unknown as OperationalDNA
}

// ── tree helpers ──────────────────────────────────────────────────────────────
function findNode(roots: PreviewNode[], id: string): PreviewNode | undefined {
  for (const r of roots) {
    if (r.id === id) return r
    const hit = findNode(r.children, id)
    if (hit) return hit
  }
  return undefined
}
/** Pages reachable below a node (descends through Workflow). */
function pagesUnder(node: PreviewNode): PreviewNode[] {
  const out: PreviewNode[] = []
  const walk = (n: PreviewNode) => { if (n.level === 'page') out.push(n); else n.children.forEach(walk) }
  node.children.forEach(walk)
  return out
}
/** Sidebar nav: one group per Module, listing its pages. */
function navGroups(app: PreviewNode): { module: PreviewNode; pages: PreviewNode[] }[] {
  return app.children.filter((c) => c.level === 'module').map((m) => ({ module: m, pages: pagesUnder(m) }))
}

/**
 * Mirror of the coarse gate's cascade (dna-react `checkReachable`): walk up
 * `contains` to the nearest ancestor that has grants and decide on it; default
 * deny. Used to pick a default page the previewed subject can actually open.
 */
function isReachable(access: ProductAppPreviewViewModel['access'], surfaceId: string, subjects: string[]): boolean {
  const subjectSet = new Set(subjects)
  const parentOf = (id: string) => access.contains.find((e) => e.child === id)?.parent
  const grantsOn = (id: string) => access.grants.filter((g) => g.surface === id)
  const seen = new Set<string>()
  let cur: string | undefined = surfaceId
  while (cur !== undefined && !seen.has(cur)) {
    seen.add(cur)
    const here = grantsOn(cur)
    if (here.length > 0) return here.some((g) => subjectSet.has(g.subject))
    cur = parentOf(cur)
  }
  return false
}

/** The page to show: the selected one if the subject can reach it, else the first reachable page. */
function effectivePageId(ctxPageId: string | null, viewModel: ProductAppPreviewViewModel, reach: (id: string) => boolean): string | null {
  const pages = viewModel.roots[0] ? navGroups(viewModel.roots[0]).flatMap((g) => g.pages) : []
  if (ctxPageId && reach(ctxPageId)) return ctxPageId
  return pages.find((p) => reach(p.id))?.id ?? null
}

// ── component registry: Component.uiType → @dna/ui-library element ─────────────
function ComponentView({ node, records }: { node: PreviewNode; records?: SurfaceRecords }) {
  const type = (node.uiType ?? '').toLowerCase()
  const labelled = (control: ReactNode) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>
      {node.name}{control}
    </label>
  )
  switch (type) {
    case 'table': case 'datatable': case 'list':
      return records ? <DataTable records={records} /> : <span style={{ color: 'var(--ui-color-text-muted)', fontSize: 'var(--ui-font-size-sm)' }}>No data bound.</span>
    case 'button':
      return (
        <Operation name={node.name} fallback={<button data-ui-button="" disabled>{node.name}</button>}>
          <button data-ui-button="" data-variant="primary">{node.name}</button>
        </Operation>
      )
    case 'card': return <div data-ui-card="" style={{ padding: 'var(--ui-space-3)', minWidth: 140 }}><div data-ui-card-title="">{node.name}</div></div>
    case 'badge': return <span data-ui-badge="">{node.name}</span>
    case 'tag': return <span data-ui-tag="">{node.name}</span>
    case 'select': case 'dropdown': return labelled(<select data-ui-input="" defaultValue=""><option value="">{node.name}…</option></select>)
    case 'input': case 'search': return labelled(<input data-ui-input="" placeholder={node.name} />)
    case 'checkbox': return <label style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', fontSize: 'var(--ui-font-size-sm)' }}><input type="checkbox" /> {node.name}</label>
    case 'switch': return <label style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', fontSize: 'var(--ui-font-size-sm)' }}><input type="checkbox" role="switch" /> {node.name}</label>
    case 'dialog': case 'modal': return <button data-ui-button="" data-variant="outline">{node.name}…</button>
    case 'form': return <div data-ui-card="" style={{ padding: 'var(--ui-space-3)' }}><div data-ui-card-title="">{node.name}</div></div>
    default: return <span data-ui-tag="" title={`Unmapped: ${node.uiType ?? 'component'}`}>{node.name}</span>
  }
}

function DataTable({ records }: { records: SurfaceRecords }) {
  return (
    <div data-ui-table-wrap="" style={{ width: '100%' }}>
      <table data-ui-table="">
        <thead>
          <tr>{records.columns.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {records.rows.map((row, i) => (
            <tr key={String(row.id ?? i)}>
              {records.columns.map((c) => <td key={c}>{row[c] == null ? '—' : String(row[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionView({ section, recordsBySurface }: { section: PreviewNode; recordsBySurface: Map<string, SurfaceRecords> }) {
  const components = section.children.filter((c) => c.level === 'component')
  if (components.length === 0) return null
  const onlyTable = components.length === 1 && (components[0].uiType ?? '').toLowerCase().match(/table|datatable|list/)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
      <h3 style={{ margin: 0, fontSize: 'var(--ui-font-size-xs)', fontWeight: 'var(--ui-font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ui-color-text-subtle)' }}>{section.name}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-3)', alignItems: onlyTable ? 'stretch' : 'flex-end' }}>
        {components.map((c) => <ComponentView key={c.id} node={c} records={recordsBySurface.get(c.id)} />)}
      </div>
    </section>
  )
}

// ── page content ──────────────────────────────────────────────────────────────
function PageContent({ viewModel, reach }: { viewModel: ProductAppPreviewViewModel; reach: (id: string) => boolean }) {
  const ctxPageId = useMachineState((s) => (s.context as { pageId: string | null }).pageId)
  const pageId = effectivePageId(ctxPageId, viewModel, reach)
  const node = pageId ? findNode(viewModel.roots, pageId) : undefined
  const recordsBySurface = useMemo(() => new Map(viewModel.surfaceRecords.map((r) => [r.surface, r] as const)), [viewModel])

  if (!node) return <div style={{ color: 'var(--ui-color-text-muted)' }}>Select a page.</div>
  const sections = node.children.filter((c) => c.level === 'section')
  const directComponents = node.children.filter((c) => c.level === 'component')

  return (
    <Surface id={node.id}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--ui-font-size-lg)', fontWeight: 'var(--ui-font-weight-semibold)' }}>{node.name}</h2>
        {directComponents.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-3)', alignItems: 'flex-end' }}>
            {directComponents.map((c) => <ComponentView key={c.id} node={c} records={recordsBySurface.get(c.id)} />)}
          </div>
        )}
        {sections.map((s) => <SectionView key={s.id} section={s} recordsBySurface={recordsBySurface} />)}
        {sections.length === 0 && directComponents.length === 0 && (
          <div style={{ color: 'var(--ui-color-text-muted)', fontStyle: 'italic' }}>This page has no sections yet.</div>
        )}
      </div>
    </Surface>
  )
}

// ── sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ viewModel, reach }: { viewModel: ProductAppPreviewViewModel; reach: (id: string) => boolean }) {
  const ctxPageId = useMachineState((s) => (s.context as { pageId: string | null }).pageId)
  const app = viewModel.roots[0]
  const groups = navGroups(app)
  const active = effectivePageId(ctxPageId, viewModel, reach)
  return (
    <nav data-ui-app-sidebar="" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
      <div style={{ fontWeight: 'var(--ui-font-weight-semibold)', fontSize: 'var(--ui-font-size-sm)' }}>{app.name}</div>
      {groups.map((g) => (
        <Surface key={g.module.id} id={g.module.id}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div style={{ fontSize: 'var(--ui-font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ui-color-text-subtle)', padding: '0 0.5rem' }}>{g.module.name}</div>
            {g.pages.map((p) => (
              <Surface key={p.id} id={p.id}>
                <MSend event={{ type: 'NAVIGATE', pageId: p.id }} data-ui-nav-item="" data-active={p.id === active ? '' : undefined}>
                  {p.name}
                </MSend>
              </Surface>
            ))}
          </div>
        </Surface>
      ))}
    </nav>
  )
}

export function ProductAppPreviewPanel({ refreshSignal }: { refreshSignal: number }) {
  const [viewModel, setViewModel] = useState<ProductAppPreviewViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewAs, setPreviewAs] = useState<string>(AUTHOR_BYPASS)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/lens/product-app-preview')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load product app preview'))))
      .then((vm: ProductAppPreviewViewModel) => { if (!cancelled) { setViewModel(vm); setError(null) } })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshSignal])

  const dna = useMemo(() => synthesizeDna(viewModel?.operationAllows ?? []), [viewModel])

  if (loading) return <div style={{ padding: '1rem', color: 'var(--ui-color-text-muted)' }}>Loading app preview…</div>
  if (error) return <div style={{ padding: '1rem', color: 'var(--ui-color-danger, crimson)' }}>{error}</div>
  if (!viewModel || viewModel.roots.length === 0) {
    return <div style={{ padding: '1rem', color: 'var(--ui-color-text-muted)', fontStyle: 'italic' }}>No product surfaces yet — seed or build an App.</div>
  }

  const bypass = previewAs === AUTHOR_BYPASS
  // Mirror the coarse gate so the default page is one the previewed subject can open.
  const reach = bypass ? () => true : (id: string) => isReachable(viewModel.access, id, ['preview', previewAs])

  return (
    <div data-ui-app-preview="" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div data-ui-app-topbar="">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)', marginLeft: 'auto' }}>
          Preview as
          <select data-ui-input="" value={previewAs} onChange={(e) => setPreviewAs(e.target.value)} style={{ fontSize: 'var(--ui-font-size-xs)' }}>
            <option value={AUTHOR_BYPASS}>All access</option>
            {viewModel.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <DnaProvider dna={bypass ? EMPTY_DNA : dna} userId="preview" roles={bypass ? [] : [previewAs]} access={bypass ? undefined : viewModel.access}>
        <MRoot machine={navMachine} style={{ flex: 1, minHeight: 0 }}>
          <div data-ui-app-shell="">
            <Sidebar viewModel={viewModel} reach={reach} />
            <main data-ui-app-content=""><PageContent viewModel={viewModel} reach={reach} /></main>
          </div>
        </MRoot>
      </DnaProvider>
    </div>
  )
}
