'use client'
import dynamic from 'next/dynamic'
import type { GraphData } from '../../lib/graph-data'

const OrgChartCanvas = dynamic(() => import('./OrgChartCanvas.client'), { ssr: false })

export default OrgChartCanvas
export type { GraphData }
