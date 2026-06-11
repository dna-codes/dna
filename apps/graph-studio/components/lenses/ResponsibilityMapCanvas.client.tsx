'use client'
import { useRef, useEffect } from 'react'
import { dia, shapes } from '@joint/plus'
import { enableZoomPan } from '../../lib/canvas-zoom-pan'
import { DEFAULT_THEME } from '../../lib/canvas-theme'
import type { FixtureTheme } from '../../lib/canvas-theme'
import type { GraphData } from '../../lib/graph-data'

const CANVAS_SIZE = 1120
const CX = CANVAS_SIZE / 2
const CY = CANVAS_SIZE / 2
const R_DEPT = 130
const R_POS  = 265
const R_STEP = 400
const DEPT_R = 28   // placement radius only
const DEPT_W = 92,  DEPT_H  = 40
const POS_W  = 130, POS_H   = 40
const STEP_W = 120, STEP_H  = 36

const NO_ARROW = { type: 'path', d: 'M 0 0 Z', fill: 'none', stroke: 'none' }

// ── Layout ────────────────────────────────────────────────────────────────────

interface NodePos { x: number; y: number; w: number; h: number }

function computeLayout(graphData: GraphData): Map<string, NodePos> {
  const pos     = new Map<string, NodePos>()
  const depts   = graphData.nodes.filter(n => n.type === 'department')
  const allPos  = graphData.nodes.filter(n => n.type === 'position')
  const allStep = graphData.nodes.filter(n => n.type === 'step')

  const deptPosIds = new Map<string, string[]>(depts.map(d => [d.id, []]))
  for (const p of allPos) {
    if (p.parentId && deptPosIds.has(p.parentId)) deptPosIds.get(p.parentId)!.push(p.id)
  }

  const posStepIds = new Map<string, string[]>(allPos.map(p => [p.id, []]))
  for (const e of graphData.edges) {
    if (e.type === 'assigned_to' && posStepIds.has(e.source)) posStepIds.get(e.source)!.push(e.target)
  }

  const N = depts.length || 1
  const startAngle = -Math.PI / 2

  for (let i = 0; i < depts.length; i++) {
    const sectorW   = (2 * Math.PI) / N
    const deptAngle = startAngle + i * sectorW

    const dx = CX + R_DEPT * Math.cos(deptAngle)
    const dy = CY + R_DEPT * Math.sin(deptAngle)
    pos.set(depts[i].id, { x: dx - DEPT_W / 2, y: dy - DEPT_H / 2, w: DEPT_W, h: DEPT_H })

    const deptPosArr = deptPosIds.get(depts[i].id) ?? []
    const P = deptPosArr.length || 1

    for (let j = 0; j < deptPosArr.length; j++) {
      const spread   = Math.min(sectorW * 0.55, 1.0)
      const posAngle = deptAngle + (j - (P - 1) / 2) * spread / Math.max(P - 1, 1)
      const px = CX + R_POS * Math.cos(posAngle)
      const py = CY + R_POS * Math.sin(posAngle)
      pos.set(deptPosArr[j], { x: px - POS_W / 2, y: py - POS_H / 2, w: POS_W, h: POS_H })

      const stepArr = posStepIds.get(deptPosArr[j]) ?? []
      const S = stepArr.length || 1

      for (let k = 0; k < stepArr.length; k++) {
        const stepSpread = Math.min(0.35, 0.2 * S)
        const stepAngle  = posAngle + (k - (S - 1) / 2) * stepSpread / Math.max(S - 1, 1)
        const sx = CX + R_STEP * Math.cos(stepAngle)
        const sy = CY + R_STEP * Math.sin(stepAngle)
        pos.set(stepArr[k], { x: sx - STEP_W / 2, y: sy - STEP_H / 2, w: STEP_W, h: STEP_H })
      }
    }
  }

  const orphanPos = allPos.filter(p => !p.parentId)
  for (let i = 0; i < orphanPos.length; i++) {
    pos.set(orphanPos[i].id, {
      x: CX - (orphanPos.length * (POS_W + 12)) / 2 + i * (POS_W + 12),
      y: CY + R_STEP + 60,
      w: POS_W, h: POS_H,
    })
  }

  const assignedStepIds = new Set(graphData.edges.filter(e => e.type === 'assigned_to').map(e => e.target))
  const orphanSteps     = allStep.filter(s => !assignedStepIds.has(s.id) && !pos.has(s.id))
  for (let i = 0; i < orphanSteps.length; i++) {
    pos.set(orphanSteps[i].id, {
      x: CX - (orphanSteps.length * (STEP_W + 10)) / 2 + i * (STEP_W + 10),
      y: CY + R_STEP + 60 + (orphanPos.length > 0 ? POS_H + 16 : 0),
      w: STEP_W, h: STEP_H,
    })
  }

  return pos
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { graphData: GraphData; theme?: FixtureTheme }

export default function ResponsibilityMapCanvas({ graphData, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return
    containerRef.current.innerHTML = ''

    const C = theme ?? DEFAULT_THEME
    const HAS_POS_LINE  = { stroke: C.accent,  strokeWidth: 1, strokeOpacity: 0.3, strokeDasharray: '4 3', targetMarker: NO_ARROW }
    const ASSIGNED_LINE = { stroke: C.primary, strokeWidth: 1, strokeOpacity: 0.45, targetMarker: NO_ARROW }

    const layout = computeLayout(graphData)

    const ns    = { ...shapes }
    const graph = new dia.Graph({}, { cellNamespace: ns })
    const paper = new dia.Paper({
      el:                containerRef.current,
      model:             graph,
      width:             CANVAS_SIZE,
      height:            CANVAS_SIZE,
      gridSize:          1,
      background:        { color: C.bg },
      cellViewNamespace: ns,
      interactive:       { elementMove: true, labelMove: false },
    })
    enableZoomPan(paper)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paper.on('element:pointerdown', (elementView: any) => {
      const clickedNode = graphData.nodes.find(n => n.id === String(elementView.model.id))
      if (clickedNode?.type === 'step') elementView.model.toFront()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cellMap = new Map<string, any>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cells: any[] = []

    for (const node of graphData.nodes) {
      const l = layout.get(node.id)
      if (!l) continue

      if (node.type === 'department') {
        const cell = new shapes.standard.Rectangle({
          id:       node.id,
          position: { x: l.x, y: l.y },
          size:     { width: l.w, height: l.h },
          attrs: {
            body:  { fill: C.primary, stroke: C.accent, strokeWidth: 2, rx: 10, ry: 10 },
            label: {
              text:               node.name,
              fill:               C.text,
              fontSize:           9,
              fontWeight:         '700',
              fontFamily:         'inherit',
              textAnchor:         'middle',
              textVerticalAnchor: 'middle',
              textWrap:           { width: -8, height: -8, ellipsis: true, breakWords: false },
            },
          },
        })
        cellMap.set(node.id, cell)
        cells.push(cell)
      } else if (node.type === 'position') {
        const cell = new shapes.standard.Rectangle({
          id:       node.id,
          position: { x: l.x, y: l.y },
          size:     { width: l.w, height: l.h },
          attrs: {
            body:  { fill: C.slate, stroke: C.accent, strokeWidth: 1.5, rx: 6, ry: 6 },
            label: {
              text:               node.name,
              fill:               C.text,
              fontSize:           10,
              fontWeight:         '500',
              fontFamily:         'inherit',
              textAnchor:         'middle',
              textVerticalAnchor: 'middle',
              textWrap:           { width: -8, height: -8, ellipsis: true, breakWords: false },
            },
          },
        })
        cellMap.set(node.id, cell)
        cells.push(cell)
      } else if (node.type === 'step') {
        const cell = new shapes.standard.Rectangle({
          id:       node.id,
          position: { x: l.x, y: l.y },
          size:     { width: l.w, height: l.h },
          attrs: {
            body:  { fill: C.slate, stroke: C.primary, strokeWidth: 1, rx: 5, ry: 5, fillOpacity: 0.7 },
            label: {
              text:               node.name,
              fill:               C.text,
              fontSize:           9,
              fontFamily:         'inherit',
              textAnchor:         'middle',
              textVerticalAnchor: 'middle',
              textWrap:           { width: -6, height: -6, ellipsis: true, breakWords: false },
            },
          },
        })
        cellMap.set(node.id, cell)
        cells.push(cell)
      }
    }

    for (const edge of graphData.edges) {
      if (!cellMap.has(edge.source) || !cellMap.has(edge.target)) continue
      const lineStyle = edge.type === 'has_position' ? HAS_POS_LINE : ASSIGNED_LINE
      cells.push(new shapes.standard.Link({
        source: { id: edge.source },
        target: { id: edge.target },
        attrs:  { line: lineStyle },
        labels: [],
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
