'use client'
import dynamic from 'next/dynamic'
import type { GraphData } from '../../lib/graph-data'

const ProcessFlowCanvas = dynamic(() => import('./ProcessFlowCanvas.client'), { ssr: false })

export default ProcessFlowCanvas
export type { GraphData }
