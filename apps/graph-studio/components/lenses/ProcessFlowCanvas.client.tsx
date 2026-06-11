'use client'
import { useRef, useEffect } from 'react'
import { dia, shapes } from '@joint/plus'
import { enableZoomPan } from '../../lib/canvas-zoom-pan'
import { DEFAULT_THEME } from '../../lib/canvas-theme'
import type { FixtureTheme } from '../../lib/canvas-theme'
import type { GraphData, GraphNode, GraphEdge } from '../../lib/graph-data'

const PROC_W = 140, PROC_H = 52
const STEP_W = 160, STEP_H = 68
const H_GAP  = 56,  V_GAP  = 80, PAD = 40

// ── Topological sort (Kahn's algorithm) ──────────────────────────────────────
function topoSort(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const ids = new Set(nodes.map(n => n.id))
  const inDeg = new Map(nodes.map(n => [n.id, 0]))
  const adj   = new Map<string, string[]>(nodes.map(n => [n.id, []]))
  for (const e of edges) {
    if (ids.has(e.source) && ids.has(e.target)) {
      adj.get(e.source)!.push(e.target)
      inDeg.set(e.target, inDeg.get(e.target)! + 1)
    }
  }
  const queue   = nodes.filter(n => inDeg.get(n.id) === 0)
  const result: GraphNode[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  while (queue.length) {
    const node = queue.shift()!
    result.push(node)
    for (const nid of adj.get(node.id) ?? []) {
      const d = inDeg.get(nid)! - 1
      inDeg.set(nid, d)
      if (d === 0) queue.push(nodeMap.get(nid)!)
    }
  }
  return result
}

// ── Layout: one horizontal row per process ───────────────────────────────────
function layout(nodes: GraphNode[], edges: GraphEdge[]) {
  const processes = nodes.filter(n => n.type === 'process')
  const allSteps  = nodes.filter(n => n.type === 'step')

  const byProcess = new Map<string, GraphNode[]>()
  for (const s of allSteps) {
    const pid = s.parentId ?? '__orphan__'
    if (!byProcess.has(pid)) byProcess.set(pid, [])
    byProcess.get(pid)!.push(s)
  }

  const pos = new Map<string, { x: number; y: number; w: number; h: number }>()
  let rowY = PAD

  for (const proc of processes) {
    const sorted = topoSort(byProcess.get(proc.id) ?? [], edges)
    pos.set(proc.id, { x: PAD, y: rowY, w: PROC_W, h: PROC_H })
    for (let i = 0; i < sorted.length; i++) {
      pos.set(sorted[i].id, {
        x: PAD + PROC_W + H_GAP + i * (STEP_W + H_GAP),
        y: rowY,
        w: STEP_W,
        h: STEP_H,
      })
    }
    rowY += STEP_H + V_GAP
  }

  const orphans = topoSort(byProcess.get('__orphan__') ?? [], edges)
  for (let i = 0; i < orphans.length; i++) {
    pos.set(orphans[i].id, { x: PAD + i * (STEP_W + H_GAP), y: rowY, w: STEP_W, h: STEP_H })
  }
  if (orphans.length) rowY += STEP_H + V_GAP

  const maxX = Math.max(...[...pos.values()].map(p => p.x + p.w), 0)
  const totalHeight = rowY === PAD ? PAD * 2 : rowY - V_GAP + PAD
  return { pos, totalWidth: maxX + PAD, totalHeight }
}

// ── Cell factories ────────────────────────────────────────────────────────────
function makeProcessCell(node: GraphNode, l: { x: number; y: number; w: number; h: number }, C: FixtureTheme) {
  return new shapes.standard.Rectangle({
    markup: [
      { tagName: 'rect', selector: 'body'  },
      { tagName: 'text', selector: 'label' },
    ],
    id:       node.id,
    position: { x: l.x, y: l.y },
    size:     { width: l.w, height: l.h },
    attrs: {
      body:  { fill: C.primary, stroke: C.accent, strokeWidth: 1.5, rx: 8, ry: 8 },
      label: {
        text: node.name, fill: C.text,
        fontSize: 11, fontWeight: '700', fontFamily: 'inherit',
        textAnchor: 'middle', textVerticalAnchor: 'middle',
        x: l.w / 2, y: l.h / 2,
        textWrap: { width: -12, height: -10, ellipsis: true, breakWords: false },
      },
    },
  })
}

function makeStepCell(node: GraphNode, l: { x: number; y: number; w: number; h: number }, C: FixtureTheme) {
  const assignedTo = node.attrs?.assignedTo as string | undefined
  return new shapes.standard.Rectangle({
    markup: [
      { tagName: 'rect',   selector: 'body'     },
      { tagName: 'text',   selector: 'label'    },
      { tagName: 'text',   selector: 'sublabel' },
      { tagName: 'text',   selector: 'assignee' },
    ],
    id:       node.id,
    position: { x: l.x, y: l.y },
    size:     { width: l.w, height: l.h },
    attrs: {
      body: { fill: C.slate, stroke: C.accent, strokeWidth: 1.5, rx: 8, ry: 8 },
      label: {
        text: node.name, fill: C.text,
        fontSize: 11, fontWeight: '500', fontFamily: 'inherit',
        textAnchor: 'middle', textVerticalAnchor: 'middle',
        x: l.w / 2, y: Math.round(l.h * 0.30),
        textWrap: { width: -12, height: 16, ellipsis: true, breakWords: false },
      },
      sublabel: {
        text: '(step)', fill: C.textMuted,
        fontSize: 9, fontFamily: 'inherit',
        textAnchor: 'middle', textVerticalAnchor: 'middle',
        x: l.w / 2, y: Math.round(l.h * 0.55),
      },
      assignee: {
        text: assignedTo ?? '', fill: C.primary,
        fontSize: 9, fontWeight: '600', fontFamily: 'inherit',
        textAnchor: 'middle', textVerticalAnchor: 'middle',
        x: l.w / 2, y: Math.round(l.h * 0.80),
      },
    },
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { graphData: GraphData; theme?: FixtureTheme }

export default function ProcessFlowCanvas({ graphData, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return
    containerRef.current.innerHTML = ''

    const C = theme ?? DEFAULT_THEME
    const ARROW = {
      stroke:       C.accent,
      strokeWidth:  1.5,
      targetMarker: { type: 'path', d: 'M 8 -4 0 0 8 4 Z', fill: C.accent },
    }

    const { pos, totalWidth, totalHeight } = layout(graphData.nodes, graphData.edges)

    const ns    = { ...shapes }
    const graph = new dia.Graph({}, { cellNamespace: ns })
    const paper = new dia.Paper({
      el:                containerRef.current,
      model:             graph,
      width:             Math.max(900, totalWidth),
      height:            Math.max(300, totalHeight),
      gridSize:          1,
      background:        { color: C.bg },
      cellViewNamespace: ns,
      interactive:       { elementMove: true, labelMove: false },
    })
    enableZoomPan(paper)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cellMap = new Map<string, any>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cells: any[] = []

    for (const node of graphData.nodes) {
      const l = pos.get(node.id)
      if (!l) continue
      const cell = node.type === 'process' ? makeProcessCell(node, l, C) : makeStepCell(node, l, C)
      cellMap.set(node.id, cell)
      cells.push(cell)
    }

    for (const proc of graphData.nodes.filter(n => n.type === 'process')) {
      const procSteps = graphData.nodes.filter(n => n.parentId === proc.id)
      const stepSet   = new Set(procSteps.map(n => n.id))
      const hasIn     = new Set(
        graphData.edges.filter(e => stepSet.has(e.target) && stepSet.has(e.source)).map(e => e.target)
      )
      for (const root of procSteps.filter(s => !hasIn.has(s.id))) {
        if (!cellMap.has(root.id)) continue
        cells.push(new shapes.standard.Link({
          source: { id: proc.id },
          target: { id: root.id },
          attrs:  { line: ARROW },
          labels: [],
          connector: { name: 'rounded' },
        }))
      }
    }

    for (const edge of graphData.edges) {
      if (!cellMap.has(edge.source) || !cellMap.has(edge.target)) continue
      cells.push(new shapes.standard.Link({
        source: { id: edge.source },
        target: { id: edge.target },
        attrs:  { line: ARROW },
        labels: [],
        connector: { name: 'rounded' },
      }))
    }

    graph.addCells(cells)
  }, [graphData, theme]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      data-testid="graph-canvas"
      style={{ width: '100%', overflowX: 'auto' }}
    />
  )
}
