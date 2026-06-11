import LensShell from '@/components/LensShell'
import DnaStat from '@/components/DnaStat'
import OrgChartCanvas from '@/components/lenses/OrgChartCanvas'
import { fromResourceGraph } from '@/lib/lenses/org-chart/fromResourceGraph'
import fixture from '../../../../../../examples/lending/dna.json'

export default function Page() {
  const graphData = fromResourceGraph(fixture)
  const companies = graphData.nodes.filter(n => n.type === 'company').map(n => n.name)
  const depts     = graphData.nodes.filter(n => n.type === 'department').map(n => n.name)
  const positions = graphData.nodes.filter(n => n.type === 'position').map(n => n.name)
  const persons   = fixture.resources.filter(r => r.type === 'person').map(r => r.name)

  return (
    <LensShell exampleLabel="ClearPath Lending" lensLabel="Org Chart" exampleId="lending" lensId="org-chart">
      <div className="canvas-wrap">
        <OrgChartCanvas graphData={graphData} />
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
          <DnaStat label="Organization" items={companies} />
          <DnaStat label="Departments"  items={depts}     />
          <DnaStat label="Positions"    items={positions} />
          <DnaStat label="People"       items={persons}   />
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
