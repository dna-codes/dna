import LensShell from '@/components/LensShell'
import DnaStat from '@/components/DnaStat'
import RunbookCanvas from '@/components/lenses/RunbookCanvas'
import { fromResourceGraph } from '@/lib/lenses/runbook/fromResourceGraph'
import fixture from '../../../../../../examples/lending/dna.json'

export default function Page() {
  const graphData   = fromResourceGraph(fixture)
  const steps       = fixture.resources.filter(r => r.type === 'step').map(r => r.name)
  const assignments = fixture.relationships
    .filter(r => r.type === 'assigned_to')
    .map(r => fixture.resources.find(res => res.id === r.to)?.name ?? r.to)
    .filter((v, i, a) => a.indexOf(v) === i)

  return (
    <LensShell exampleLabel="ClearPath Lending" lensLabel="Runbook" exampleId="lending" lensId="runbook">
      <RunbookCanvas graphData={graphData} />
      <div className="dna-summary">
        <div className="dna-summary-header">
          <span className="dna-summary-title">About this DNA</span>
          <span className="badge badge-info">
            {graphData.nodes.length} steps · {assignments.length} roles
          </span>
        </div>
        <p className="dna-summary-desc">{fixture.description}</p>
        <div className="dna-summary-grid">
          <DnaStat label="Steps" items={steps}       />
          <DnaStat label="Roles" items={assignments} />
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
