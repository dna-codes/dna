'use client'
import dynamic from 'next/dynamic'
import type { GraphData } from '../../lib/graph-data'

const ResponsibilityMapCanvas = dynamic(() => import('./ResponsibilityMapCanvas.client'), { ssr: false })

export default ResponsibilityMapCanvas
export type { GraphData }
