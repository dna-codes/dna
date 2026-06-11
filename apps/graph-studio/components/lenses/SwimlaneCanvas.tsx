'use client'
import dynamic from 'next/dynamic'
import type { SwimlaneData } from '../../lib/lenses/swimlane/fromResourceGraph'

const SwimlaneCanvas = dynamic(() => import('./SwimlaneCanvas.client'), { ssr: false })

export default SwimlaneCanvas
export type { SwimlaneData }
