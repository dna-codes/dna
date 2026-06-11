import LensShell from '@/components/LensShell'
import DnaStat from '@/components/DnaStat'
import ResponsibilityMapCanvas from '@/components/lenses/ResponsibilityMapCanvas'
import { fromResourceGraph } from '@/lib/lenses/responsibility-map/fromResourceGraph'
import fixture from '../../../../../../examples/lending/dna.json'

export default function Page() {
  const graphData = fromResourceGraph(fixture)
  const depts     = graphData.nodes.filter(n => n.type === 'department').map(n => n.name)
  const positions = graphData.nodes.filter(n => n.type === 'position').map(n => n.name)
  const steps     = graphData.nodes.filter(n => n.type === 'step').map(n => n.name)

  return (
    <LensShell exampleLabel="ClearPath Lending" lensLabel="Responsibility Map" exampleId="lending" lensId="responsibility-map">
      <div className="canvas-wrap">
        <ResponsibilityMapCanvas graphData={graphData} />
      </div>
      <div className="dna-summary">
        <div className="dna-summary-header">
          <span className="dna-summary-title">About this DNA</span>
          <span className="badge badge-info">
            {depts.length} depts · {positions.length} positions · {steps.length} steps
          </span>
        </div>
        <p className="dna-summary-desc">{fixture.description}</p>
        <div className="dna-summary-grid">
          <DnaStat label="Departments" items={depts}     />
          <DnaStat label="Positions"   items={positions} />
          <DnaStat label="Steps"       items={steps}     />
        </div>
        <details className="dna-raw">
          <summary className="dna-raw-toggle">View raw DNA</summary>
          <pre className="dna-raw-pre"><code>{JSON.stringify(fixture, null, 2)}</code></pre>
        </details>
        <div className="dna-summary-note">
          Fixture: <code>examples/lending/dna.json</code>
        </div>
      </div>
    </LensShell>
  )
}
