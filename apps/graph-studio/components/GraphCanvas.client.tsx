'use client'
import { useRef, useEffect } from 'react'
import type { GraphData } from '../lib/graph-data'

interface Props {
  graphData: GraphData
}

export default function GraphCanvasClient({ graphData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return

    let paper: { el: HTMLElement } | null = null

    const initJoint = async () => {
      const { dia } = await import('@joint/plus')
      const graph = new dia.Graph({}, { cellNamespace: {} })
      paper = new dia.Paper({
        el: containerRef.current!,
        model: graph,
        width: '100%',
        height: '100%',
      })
    }

    initJoint().catch(console.error)

    return () => {
      if (paper?.el && containerRef.current?.contains(paper.el)) {
        // cleanup handled by JointJS Paper
      }
    }
  }, [graphData])

  return (
    <div
      ref={containerRef}
      data-testid="graph-canvas"
      style={{ width: '100%', height: '600px' }}
    />
  )
}
