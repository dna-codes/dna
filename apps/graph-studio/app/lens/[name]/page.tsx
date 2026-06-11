import { notFound } from 'next/navigation'
import { getLens } from '../../../lib/lens-registry'
import GraphCanvas from '../../../components/GraphCanvas'
import type { GraphData } from '../../../lib/graph-data'

interface Props {
  params: Promise<{ name: string }>
}

export default async function LensPage({ params }: Props) {
  const { name } = await params
  const lens = getLens(name)

  if (!lens) {
    notFound()
  }

  // Placeholder until per-lens data loaders are wired
  const graphData: GraphData = { nodes: [], edges: [] }

  return (
    <main style={{ padding: '1rem' }}>
      <h1>{lens.title}</h1>
      <p>{lens.description}</p>
      <GraphCanvas graphData={graphData} />
    </main>
  )
}
