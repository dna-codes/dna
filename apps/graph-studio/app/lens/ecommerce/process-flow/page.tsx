import LensShell from '@/components/LensShell'
import DnaStat from '@/components/DnaStat'
import ProcessFlowCanvas from '@/components/lenses/ProcessFlowCanvas'
import { fromResourceGraph } from '@/lib/lenses/process-flow/fromResourceGraph'
import fixture from '../../../../../../examples/ecommerce/dna.json'

export default function Page() {
  const graphData = fromResourceGraph(fixture)
  const processes = fixture.resources.filter(r => r.type === 'process').map(r => r.name)
  const steps     = fixture.resources.filter(r => r.type === 'step').map(r => r.name)

  return (
    <LensShell exampleLabel="Apex Commerce" lensLabel="Process Flow" exampleId="ecommerce" lensId="process-flow">
      <div className="canvas-wrap">
        <ProcessFlowCanvas graphData={graphData} />
      </div>
      <div className="dna-summary">
        <div className="dna-summary-header">
          <span className="dna-summary-title">About this DNA</span>
          <span className="badge badge-info">
            {graphData.nodes.length} nodes · {graphData.edges.length} edges
          </span>
        </div>
        <p className="dna-summary-desc">{fixture.description}</p>
        <div className="dna-summary-grid">
          <DnaStat label="Processes" items={processes} />
          <DnaStat label="Steps"     items={steps}     />
        </div>
        <details className="dna-raw">
          <summary className="dna-raw-toggle">View raw DNA</summary>
          <pre className="dna-raw-pre"><code>{JSON.stringify(fixture, null, 2)}</code></pre>
        </details>
        <div className="dna-summary-note">
          Fixture: <code>examples/ecommerce/dna.json</code>
        </div>
      </div>
    </LensShell>
  )
}
