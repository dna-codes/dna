import LensShell from '@/components/LensShell'
import DnaStat from '@/components/DnaStat'
import SwimlaneCanvas from '@/components/lenses/SwimlaneCanvas'
import { fromResourceGraph } from '@/lib/lenses/swimlane/fromResourceGraph'
import fixture from '../../../../../../examples/ecommerce/dna.json'

export default function Page() {
  const swimlaneData = fromResourceGraph(fixture)
  const roles = swimlaneData.lanes.filter(l => l.roleId !== 'unassigned').map(l => l.roleName)
  const steps = fixture.resources.filter(r => r.type === 'step').map(r => r.name)

  return (
    <LensShell exampleLabel="Apex Commerce" lensLabel="Swimlane" exampleId="ecommerce" lensId="swimlane">
      <div className="canvas-wrap">
        <SwimlaneCanvas swimlaneData={swimlaneData} />
      </div>
      <div className="dna-summary">
        <div className="dna-summary-header">
          <span className="dna-summary-title">About this DNA</span>
          <span className="badge badge-info">
            {swimlaneData.lanes.length} lanes · {steps.length} steps
          </span>
        </div>
        <p className="dna-summary-desc">{fixture.description}</p>
        <div className="dna-summary-grid">
          <DnaStat label="Roles" items={roles}  />
          <DnaStat label="Steps" items={steps}  />
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
