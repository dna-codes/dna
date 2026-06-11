'use client'
import { useRef, useEffect } from 'react'
import { dia, shapes } from '@joint/plus'
import { enableZoomPan } from '../../lib/canvas-zoom-pan'
import { DEFAULT_THEME } from '../../lib/canvas-theme'
import type { FixtureTheme } from '../../lib/canvas-theme'
import type { SwimlaneData, LaneData } from '../../lib/lenses/swimlane/fromResourceGraph'
import type { GraphNode } from '../../lib/graph-data'

const LABEL_W    = 130
const STEP_W     = 140
const STEP_H     = 54
const H_GAP      = 36
const LANE_PAD_X = 16
const LANE_PAD_Y = 20
const LANE_H     = STEP_H + 2 * LANE_PAD_Y   // 94

// ── Cells ─────────────────────────────────────────────────────────────────────

function makeLaneBg(lane: LaneData, idx: number, canvasW: number, C: FixtureTheme) {
  // Derive alternating lane fills from the theme's bg/slate so any palette works
  const fills = idx % 2 === 0 ? [C.slate, C.bg] : [C.bg, C.slate]

  const laneY = idx * LANE_H
  return new shapes.standard.Rectangle({
    markup: [
      { tagName: 'rect', selector: 'body'    },
      { tagName: 'line', selector: 'divider' },
      { tagName: 'text', selector: 'label'   },
    ],
    position: { x: 0, y: laneY },
    size:     { width: canvasW, height: LANE_H },
    z: 0,
    attrs: {
      body: {
        fill:          fills[0],
        stroke:        C.accent,
        strokeWidth:   0.5,
        strokeOpacity: 0.25,
        rx: 0, ry: 0,
      },
      divider: {
        x1: LABEL_W, y1: 0,
        x2: LABEL_W, y2: LANE_H,
        stroke:      'rgba(128,128,128,0.15)',
        strokeWidth: 1,
      },
      label: {
        text:               lane.roleName,
        fill:               C.textMuted,
        fontSize:           10,
        fontWeight:         '500',
        fontFamily:         'inherit',
        textAnchor:         'middle',
        textVerticalAnchor: 'middle',
        x:                  LABEL_W / 2,
        y:                  LANE_H / 2,
      },
    },
  })
}

function makeStepCell(step: GraphNode, x: number, y: number, C: FixtureTheme) {
  return new shapes.standard.Rectangle({
    markup: [
      { tagName: 'rect', selector: 'body'  },
      { tagName: 'text', selector: 'label' },
    ],
    id:       step.id,
    position: { x, y },
    size:     { width: STEP_W, height: STEP_H },
    z: 1,
    attrs: {
      body: {
        fill:        C.slate,
        stroke:      C.accent,
        strokeWidth: 1.5,
        rx: 8, ry: 8,
      },
      label: {
        text:               step.name,
        fill:               C.text,
        fontSize:           11,
        fontWeight:         '500',
        fontFamily:         'inherit',
        textAnchor:         'middle',
        textVerticalAnchor: 'middle',
        x:                  STEP_W / 2,
        y:                  STEP_H / 2,
        textWrap:           { width: -12, height: -10, ellipsis: true, breakWords: false },
      },
    },
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { swimlaneData: SwimlaneData; theme?: FixtureTheme }

export default function SwimlaneCanvas({ swimlaneData, theme }: Props) {
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

    const maxSteps = Math.max(...swimlaneData.lanes.map(l => l.steps.length), 1)
    const canvasW  = LABEL_W + LANE_PAD_X + maxSteps * (STEP_W + H_GAP) - H_GAP + LANE_PAD_X + 40
    const canvasH  = swimlaneData.lanes.length * LANE_H

    const ns    = { ...shapes }
    const graph = new dia.Graph({}, { cellNamespace: ns })
    const paper = new dia.Paper({
      el:                containerRef.current,
      model:             graph,
      width:             Math.max(900, canvasW),
      height:            Math.max(200, canvasH),
      gridSize:          1,
      background:        { color: C.bg },
      cellViewNamespace: ns,
      interactive:       false,
    })
    enableZoomPan(paper)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cells: any[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cellMap = new Map<string, any>()

    for (let i = 0; i < swimlaneData.lanes.length; i++) {
      cells.push(makeLaneBg(swimlaneData.lanes[i], i, canvasW, C))
    }

    for (let i = 0; i < swimlaneData.lanes.length; i++) {
      const lane  = swimlaneData.lanes[i]
      const laneY = i * LANE_H + LANE_PAD_Y
      for (let j = 0; j < lane.steps.length; j++) {
        const x    = LABEL_W + LANE_PAD_X + j * (STEP_W + H_GAP)
        const cell = makeStepCell(lane.steps[j], x, laneY, C)
        cellMap.set(lane.steps[j].id, cell)
        cells.push(cell)
      }
    }

    for (const edge of swimlaneData.edges) {
      if (!cellMap.has(edge.source) || !cellMap.has(edge.target)) continue
      cells.push(new shapes.standard.Link({
        source:    { id: edge.source },
        target:    { id: edge.target },
        attrs:     { line: ARROW },
        labels:    [],
        connector: { name: 'rounded' },
        z: 2,
      }))
    }

    graph.addCells(cells)
  }, [swimlaneData, theme]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      data-testid="graph-canvas"
      style={{ width: '100%', overflowX: 'auto' }}
    />
  )
}
