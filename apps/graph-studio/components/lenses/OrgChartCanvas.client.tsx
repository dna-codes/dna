'use client'
import { useRef, useEffect } from 'react'
import { useMachine } from '@xstate/react'
import { dia, shapes } from '@joint/plus'
import { canvasInteractionMachine } from '../../lib/machines/canvas-interaction'
import { enableZoomPan } from '../../lib/canvas-zoom-pan'
import { DEFAULT_THEME } from '../../lib/canvas-theme'
import type { FixtureTheme } from '../../lib/canvas-theme'
import type { GraphData, GraphNode } from '../../lib/graph-data'

// ── Node dimensions by type ───────────────────────────────────────────────────
const SIZES: Record<string, { w: number; h: number }> = {
  company:    { w: 220, h: 56 },
  department: { w: 190, h: 54 },
  position:   { w: 170, h: 54 },
  domain:     { w: 200, h: 54 },
  group:      { w: 175, h: 54 },
  person:     { w: 145, h: 54 },
  process:    { w: 175, h: 54 },
  step:       { w: 155, h: 54 },
}
const H_GAP = 28
const V_GAP = 72
const PAD   = 52

// ── Tree layout ───────────────────────────────────────────────────────────────
function treeLayout(nodes: GraphNode[]) {
  const nodeMap  = new Map(nodes.map(n => [n.id, n]))
  const children = new Map<string, string[]>()
  const roots: string[] = []

  for (const node of nodes) {
    if (node.parentId) {
      if (!children.has(node.parentId)) children.set(node.parentId, [])
      children.get(node.parentId)!.push(node.id)
    } else {
      roots.push(node.id)
    }
  }

  const sizeOf = (id: string) => SIZES[nodeMap.get(id)?.type ?? ''] ?? { w: 160, h: 54 }

  function subtreeWidth(id: string): number {
    const kids = children.get(id)
    if (!kids?.length) return sizeOf(id).w
    const kidsTotal = kids.reduce((sum, k) => sum + subtreeWidth(k), 0) + (kids.length - 1) * H_GAP
    return Math.max(sizeOf(id).w, kidsTotal)
  }

  const pos = new Map<string, { x: number; y: number; w: number; h: number }>()

  function place(id: string, xLeft: number, y: number, availW: number) {
    const { w, h } = sizeOf(id)
    pos.set(id, { x: xLeft + (availW - w) / 2, y, w, h })
    const kids = children.get(id) ?? []
    let kx = xLeft
    for (const kid of kids) {
      const kw = subtreeWidth(kid)
      place(kid, kx, y + h + V_GAP, kw)
      kx += kw + H_GAP
    }
  }

  let rx = PAD
  for (const rootId of roots) {
    const rw = subtreeWidth(rootId)
    place(rootId, rx, PAD, rw)
    rx += rw + H_GAP * 4
  }

  const maxX = Math.max(...[...pos.values()].map(p => p.x + p.w), 0)
  const maxY = Math.max(...[...pos.values()].map(p => p.y + p.h), 0)
  return { pos, totalWidth: maxX + PAD, totalHeight: maxY + PAD }
}

// ── Cell factory ─────────────────────────────────────────────────────────────
function makeCell(
  node: GraphNode,
  layout: { x: number; y: number; w: number; h: number },
  collapsed: string[],
  C: FixtureTheme,
) {
  const isCollapsed = collapsed.includes(node.id)
  const nameText   = node.type === 'domain' && isCollapsed ? `▶ ${node.name}` : node.name
  const filledBy   = node.attrs?.filledBy as { name: string; initials: string } | undefined

  const AV_CX = layout.w - 17
  const AV_CY = 17
  const AV_R  = 13

  const textX = filledBy ? layout.w / 2 - 10 : layout.w / 2

  return new shapes.standard.Rectangle({
    markup: [
      { tagName: 'rect',   selector: 'body'      },
      { tagName: 'text',   selector: 'label'     },
      { tagName: 'text',   selector: 'sublabel'  },
      ...(filledBy ? [
        { tagName: 'circle', selector: 'avatar'     },
        { tagName: 'text',   selector: 'avatarText' },
      ] : []),
    ],
    id:       node.id,
    position: { x: layout.x, y: layout.y },
    size:     { width: layout.w, height: layout.h },
    attrs: {
      body: {
        fill:             C.slate,
        stroke:           C.accent,
        strokeWidth:      1.5,
        rx:               8,
        ry:               8,
        ...(node.type === 'position' && !filledBy ? { strokeDasharray: '5 4' } : {}),
      },
      label: {
        text:               nameText,
        fill:               C.text,
        fontSize:           11,
        fontWeight:         '500',
        fontFamily:         'inherit',
        textAnchor:         'middle',
        textVerticalAnchor: 'middle',
        x:                  textX,
        y:                  Math.round(layout.h * 0.37),
        textWrap:           { width: filledBy ? -44 : -16, height: 16, ellipsis: true, breakWords: false },
      },
      sublabel: {
        text:               `(${node.type})`,
        fill:               C.textMuted,
        fontSize:           9,
        fontWeight:         '400',
        fontFamily:         'inherit',
        textAnchor:         'middle',
        textVerticalAnchor: 'middle',
        x:                  textX,
        y:                  Math.round(layout.h * 0.70),
      },
      ...(filledBy ? {
        avatar: {
          cx:          AV_CX,
          cy:          AV_CY,
          r:           AV_R,
          fill:        C.primary,
          stroke:      C.bg,
          strokeWidth: 2.5,
        },
        avatarText: {
          text:               filledBy.initials,
          x:                  AV_CX,
          y:                  AV_CY,
          textAnchor:         'middle',
          textVerticalAnchor: 'middle',
          fontSize:           9,
          fontWeight:         '700',
          fontFamily:         'inherit',
          fill:               C.bg,
        },
      } : {}),
    },
  })
}

// ── Edge label ────────────────────────────────────────────────────────────────
function edgeLabel(text: string, C: FixtureTheme) {
  return [{
    markup: [
      { tagName: 'rect', selector: 'body'  },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      label: {
        text,
        fill:       C.textMuted,
        fontSize:   10,
        fontFamily: 'inherit',
        fontWeight: '400',
        textAnchor: 'middle',
      },
      body: {
        ref:        'label',
        refX:       -4,
        refY:       -3,
        refWidth:   '100%',
        refHeight:  '100%',
        refWidth2:  8,
        refHeight2: 6,
        fill:       C.bg,
        stroke:     'none',
        rx:         3,
        ry:         3,
      },
    },
    position: 0.5,
  }]
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { graphData: GraphData; theme?: FixtureTheme }

export default function OrgChartCanvas({ graphData, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, send] = useMachine(canvasInteractionMachine)

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return
    containerRef.current.innerHTML = ''

    const C = theme ?? DEFAULT_THEME
    const ARROW = {
      stroke:       C.accent,
      strokeWidth:  1.5,
      targetMarker: { type: 'path', d: 'M 8 -4 0 0 8 4 Z', fill: C.accent },
    }
    const ARROW_DOTTED = {
      stroke:           C.accent,
      strokeWidth:      1.5,
      strokeDasharray:  '5 4',
      targetMarker:     { type: 'path', d: 'M 8 -4 0 0 8 4 Z', fill: C.accent },
    }

    const { pos, totalWidth, totalHeight } = treeLayout(graphData.nodes)

    const cellNamespace = { ...shapes }
    const graph = new dia.Graph({}, { cellNamespace })
    const paper = new dia.Paper({
      el:                containerRef.current,
      model:             graph,
      width:             Math.max(900, totalWidth),
      height:            Math.max(400, totalHeight),
      gridSize:          1,
      background:        { color: C.bg },
      cellViewNamespace: cellNamespace,
      interactive:       { elementMove: true, labelMove: false },
    })
    enableZoomPan(paper)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cellMap = new Map<string, any>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cells: any[] = []

    for (const node of graphData.nodes) {
      const layout = pos.get(node.id)
      if (!layout) continue
      const cell = makeCell(node, layout, state.context.collapsed, C)
      cellMap.set(node.id, cell)
      cells.push(cell)
    }

    for (const node of graphData.nodes) {
      if (!node.parentId || !cellMap.has(node.parentId)) continue
      const unfilled = node.type === 'position' && !node.attrs?.filledBy
      cells.push(new shapes.standard.Link({
        source: { id: node.id },
        target: { id: node.parentId },
        attrs:  { line: unfilled ? ARROW_DOTTED : ARROW },
        labels: [],
      }))
    }

    for (const edge of graphData.edges) {
      if (!cellMap.has(edge.source) || !cellMap.has(edge.target)) continue
      cells.push(new shapes.standard.Link({
        source: { id: edge.source },
        target: { id: edge.target },
        attrs:  { line: ARROW },
        labels: edge.type ? edgeLabel(edge.type, C) : [],
      }))
    }

    graph.addCells(cells)
  }, [graphData, theme, state.context.collapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  const domainNodes = graphData.nodes.filter(n => n.type === 'domain')

  return (
    <div>
      {domainNodes.length > 0 && (
        <div className="canvas-controls">
          {domainNodes.map(node => {
            const isCollapsed = state.context.collapsed.includes(node.id)
            return (
              <button
                key={node.id}
                data-testid={`toggle-${node.id}`}
                className={`canvas-toggle-btn${isCollapsed ? ' collapsed' : ''}`}
                onClick={() => send({ type: 'TOGGLE_DOMAIN', nodeId: node.id })}
              >
                {isCollapsed ? '▶' : '▼'} {node.name}
              </button>
            )
          })}
        </div>
      )}
      <div
        ref={containerRef}
        data-testid="graph-canvas"
        style={{ width: '100%', overflowX: 'auto' }}
      />
    </div>
  )
}
