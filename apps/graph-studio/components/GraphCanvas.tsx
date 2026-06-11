'use client'
import dynamic from 'next/dynamic'
import type { GraphData } from '../lib/graph-data'

const GraphCanvas = dynamic(() => import('./GraphCanvas.client'), { ssr: false })

export default GraphCanvas
export type { GraphData }
