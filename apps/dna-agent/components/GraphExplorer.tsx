'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface GraphNode { id: string; type: string; name: string }
interface GraphEdge { id: string; source: string; target: string; type: string }
interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }

type LayoutMode = 'tree' | 'force' | 'directed'

const NODE_W = 160
const NODE_H = 56

const BRAND_COLOR = '#0D9488'

function nodeAttrs(name: string, type: string) {
  const color = BRAND_COLOR
  return {
    body: { refWidth: '100%', refHeight: '100%', fill: 'transparent', stroke: color, strokeWidth: 1.5, rx: 6, ry: 6 },
    label: {
      text: name,
      fill: '#E5ECF6',
      fontSize: 11,
      fontFamily: 'ui-monospace, monospace',
      fontWeight: 600,
      textVerticalAnchor: 'middle',
      textAnchor: 'middle',
      refX: '50%',
      refY: '38%',
      textWrap: { width: NODE_W - 16, maxLineCount: 1, ellipsis: true },
    },
    sublabel: {
      text: type,
      fill: color,
      fontSize: 9,
      fontFamily: 'ui-monospace, monospace',
      fontWeight: 400,
      textVerticalAnchor: 'middle',
      textAnchor: 'middle',
      refX: '50%',
      refY: '70%',
      textWrap: { width: NODE_W - 16, maxLineCount: 1, ellipsis: true },
    },
  }
}

function linkAttrs(relType: string) {
  return {
    attrs: {
      line: {
        stroke: 'rgba(13,148,136,0.6)',
        strokeWidth: 1.5,
        targetMarker: { type: 'path', d: 'M 8 -4 0 0 8 4 Z', fill: 'rgba(13,148,136,0.8)', stroke: 'none' },
      },
    },
    labels: relType ? [{
      attrs: {
        text: { text: relType, fontSize: 9, fill: 'rgba(229,236,246,0.65)', fontFamily: 'ui-monospace, monospace' },
        rect: { fill: 'none', stroke: 'none' },
      },
      position: 0.5,
    }] : [],
  }
}

export function GraphExplorer({ refreshSignal }: { refreshSignal: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<any>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('directed')

  const fitView = useCallback(() => {
    paperRef.current?.scaleContentToFit({ padding: 40, minScaleX: 0.1, maxScaleX: 1.5, minScaleY: 0.1, maxScaleY: 1.5 })
  }, [])

  const zoomBy = useCallback((factor: number) => {
    const paper = paperRef.current
    if (!paper) return
    const { sx } = paper.scale()
    const newScale = Math.min(3, Math.max(0.1, sx * factor))
    const w = containerRef.current?.offsetWidth ?? 600
    const h = containerRef.current?.offsetHeight ?? 400
    paper.scale(newScale, newScale)
    paper.translate(w / 2 * (1 - newScale / sx), h / 2 * (1 - newScale / sx))
  }, [])

  const build = useCallback(async () => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
    if (!containerRef.current) return

    // Capture dimensions before any async work — setStatus('loading') triggers a
    // re-render that sets display:none on the container, making offsetWidth return 0.
    const W = containerRef.current.offsetWidth || 800
    const H = containerRef.current.offsetHeight || 600

    setStatus('loading')

    let data: GraphData
    try {
      const res = await fetch('/api/graph')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data = await res.json()
    } catch (e) {
      setErrorMsg(String(e)); setStatus('error'); return
    }

    if (data.nodes.length === 0) { setStatus('empty'); return }

    containerRef.current.innerHTML = ''
    const joint = await import('@joint/core')

    const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes })
    const paper = new joint.dia.Paper({
      el: containerRef.current,
      model: graph,
      width: W,
      height: H,
      background: { color: '#0A0F1E' },
      interactive: { elementMove: false },
      gridSize: 1,
    })
    paperRef.current = paper

    const nodeIds = new Set(data.nodes.map(n => n.id))
    const validEdges = data.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))

    // Detect edge direction: if exactly one node has no outgoing edges (e.g. CEO in a
    // reports_to graph), edges flow child→parent and need reversal for top-down display.
    const hasSrc = new Set(validEdges.map(e => e.source))
    const hasTgt = new Set(validEdges.map(e => e.target))
    const noOutgoing = data.nodes.filter(n => !hasSrc.has(n.id))
    const noIncoming = data.nodes.filter(n => !hasTgt.has(n.id))
    const reversed = noOutgoing.length === 1 && noIncoming.length > 1
    const src = (e: GraphEdge) => reversed ? e.target : e.source
    const tgt = (e: GraphEdge) => reversed ? e.source : e.target

    // ── Create elements ──────────────────────────────────────────────────────
    const elementById = new Map<string, any>()
    for (const node of data.nodes) {
      const el = new joint.dia.Element({
        type: 'dna.Node',
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'text', selector: 'label' },
          { tagName: 'text', selector: 'sublabel' },
        ],
        position: { x: 0, y: 0 },
        size: { width: NODE_W, height: NODE_H },
        attrs: nodeAttrs(node.name, node.type),
      })
      graph.addCell(el)
      elementById.set(node.id, el)
    }

    // ── Create links ─────────────────────────────────────────────────────────
    for (const edge of validEdges) {
      const srcEl = elementById.get(src(edge))
      const tgtEl = elementById.get(tgt(edge))
      if (!srcEl || !tgtEl) continue
      graph.addCell(new joint.shapes.standard.Link({
        source: { id: srcEl.id },
        target: { id: tgtEl.id },
        ...linkAttrs(edge.type),
      }))
    }

    // ── Apply layout ─────────────────────────────────────────────────────────
    if (layoutMode === 'tree') {
      const { layout } = await import('@joint/plus')

      // Root = node with no incoming edges after reversal (the authority apex)
      const incomingIds = new Set(validEdges.map(e => tgt(e)))
      const rootNode = data.nodes.find(n => !incomingIds.has(n.id))
      if (rootNode) {
        elementById.get(rootNode.id)?.position(W / 2 - NODE_W / 2, 40)
      }

      new layout.TreeLayout({
        graph,
        direction: 'B',
        parentGap: 60,
        siblingGap: 24,
      }).layout()

    } else if (layoutMode === 'force') {
      const { layout } = await import('@joint/plus')

      const forceLayout = new layout.ForceDirected({
        graph,
        layoutArea: { x: 0, y: 0, width: W, height: H },
        gravityCenter: { x: W / 2, y: H / 2 },
        charge: 2500,
        linkDistance: 140,
        gravity: 0.3,
      })
      let steps = 0
      while (!forceLayout.hasConverged() && steps < 600) {
        forceLayout.step()
        steps++
      }

    } else {
      // Directed — dagre TB, node positions only (no edge waypoints)
      const dagre = await import('@dagrejs/dagre')
      const g = new dagre.graphlib.Graph()
      g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80, marginx: 40, marginy: 40 })
      g.setDefaultEdgeLabel(() => ({}))
      for (const node of data.nodes) {
        g.setNode(node.id, { width: NODE_W, height: NODE_H })
      }
      for (const edge of validEdges) {
        g.setEdge(src(edge), tgt(edge))
      }
      dagre.layout(g)
      for (const node of data.nodes) {
        const pos = g.node(node.id)
        const el = elementById.get(node.id)
        if (pos && el) el.position(pos.x - NODE_W / 2, pos.y - NODE_H / 2)
      }
    }

    paper.scaleContentToFit({ padding: 40, minScaleX: 0.1, maxScaleX: 1.5, minScaleY: 0.1, maxScaleY: 1.5 })

    // ── Pan ──────────────────────────────────────────────────────────────────
    let panning = false
    let panStart = { x: 0, y: 0 }
    let originTx = { tx: 0, ty: 0 }

    ;(paper as any).on('blank:pointerdown', (evt: any) => {
      panning = true
      panStart = { x: evt.clientX, y: evt.clientY }
      const t = paper.translate()
      originTx = { tx: t.tx, ty: t.ty }
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
    })

    const onMouseMove = (e: MouseEvent) => {
      if (!panning) return
      paper.translate(originTx.tx + e.clientX - panStart.x, originTx.ty + e.clientY - panStart.y)
    }
    const onMouseUp = () => {
      if (!panning) return
      panning = false
      if (containerRef.current) containerRef.current.style.cursor = 'grab'
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    // ── Zoom ─────────────────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { sx } = paper.scale()
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const newScale = Math.min(3, Math.max(0.1, sx * factor))
      const rect = (containerRef.current as HTMLElement).getBoundingClientRect()
      const { tx, ty } = paper.translate()
      const lx = (e.clientX - rect.left - tx) / sx
      const ly = (e.clientY - rect.top - ty) / sx
      paper.scale(newScale, newScale)
      paper.translate(e.clientX - rect.left - lx * newScale, e.clientY - rect.top - ly * newScale)
    }
    containerRef.current.addEventListener('wheel', onWheel, { passive: false })

    // ── Resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        paper.setDimensions(containerRef.current.offsetWidth, containerRef.current.offsetHeight)
    })
    ro.observe(containerRef.current)

    if (containerRef.current) containerRef.current.style.cursor = 'grab'

    const containerEl = containerRef.current
    cleanupRef.current = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      containerEl?.removeEventListener('wheel', onWheel)
      ro.disconnect()
    }

    setStatus('ready')
  }, [layoutMode])

  useEffect(() => {
    build()
    return () => { if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null } }
  }, [build, refreshSignal])

  const btnStyle: React.CSSProperties = {
    width: 28, height: 28,
    background: 'rgba(15,23,42,0.85)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Status overlays */}
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Loading graph…
        </div>
      )}
      {status === 'empty' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No instances yet. Ask the agent to build your graph.
        </div>
      )}
      {status === 'error' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem', padding: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Layout selector — top-left */}
      <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10, display: 'flex', gap: 4 }}>
        {(['tree', 'force', 'directed'] as LayoutMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setLayoutMode(mode)}
            style={{
              ...btnStyle,
              width: 'auto',
              padding: '0 0.5rem',
              fontSize: '0.7rem',
              fontFamily: 'ui-monospace, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: layoutMode === mode ? 'rgba(13,148,136,0.2)' : 'rgba(15,23,42,0.85)',
              borderColor: layoutMode === mode ? 'var(--primary)' : 'var(--border)',
              color: layoutMode === mode ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Zoom controls — top-right */}
      {status === 'ready' && (
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: '⊞', title: 'Fit view', action: fitView },
            { label: '+', title: 'Zoom in', action: () => zoomBy(1.2) },
            { label: '−', title: 'Zoom out', action: () => zoomBy(1 / 1.2) },
          ].map(btn => (
            <button key={btn.label} title={btn.title} onClick={btn.action} style={btnStyle}>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
