import LensShell from '@/components/LensShell'
import DnaStat from '@/components/DnaStat'
import JobDescriptionCanvas from '@/components/lenses/JobDescriptionCanvas'
import { fromResourceGraph } from '@/lib/lenses/job-description/fromResourceGraph'
import fixture from '../../../../../../examples/audiobook-distributor/dna.json'

export default function Page() {
  const data = fromResourceGraph(fixture)
  const positions = fixture.resources.filter(r => r.type === 'position').map(r => r.name)

  return (
    <LensShell exampleLabel={fixture.name} lensLabel="Job Description" exampleId="audiobook-distributor" lensId="job-description" theme={fixture.theme}>
      <div className="canvas-wrap">
        <JobDescriptionCanvas data={data} />
      </div>
      <div className="dna-summary">
        <div className="dna-summary-header">
          <span className="dna-summary-title">About this DNA</span>
          <span className="badge badge-info">
            {data.positions.length} positions
          </span>
        </div>
        <p className="dna-summary-desc">{fixture.description}</p>
        <div className="dna-summary-grid">
          <DnaStat label="Positions" items={positions} />
        </div>
        <details className="dna-raw">
          <summary className="dna-raw-toggle">View raw DNA</summary>
          <pre className="dna-raw-pre"><code>{JSON.stringify(fixture, null, 2)}</code></pre>
        </details>
        <div className="dna-summary-note">
          Fixture: <code>examples/audiobook-distributor/dna.json</code>
        </div>
      </div>
    </LensShell>
  )
}
