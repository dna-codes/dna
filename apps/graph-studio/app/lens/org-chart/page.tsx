import Link from 'next/link'
import { fromResourceGraph } from '../../../lib/lenses/org-chart/fromResourceGraph'
import OrgChartCanvas from '../../../components/lenses/OrgChartCanvas'
import mfjFixture from '../../../../../examples/mass-torts-org/org-chart.json'

export default function OrgChartPage() {
  const graphData = fromResourceGraph(mfjFixture)

  const nodeCount  = graphData.nodes.length
  const edgeCount  = graphData.edges.length
  const companies  = graphData.nodes.filter(n => n.type === 'company').map(n => n.name)
  const depts      = graphData.nodes.filter(n => n.type === 'department').map(n => n.name)
  const positions  = graphData.nodes.filter(n => n.type === 'position').map(n => n.name)
  const persons    = mfjFixture.resources.filter(r => r.type === 'person').map(r => r.name)

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-brand">DNA <span>Graph Studio</span></div>
        <Link href="/" className="nav-back">← All lenses</Link>
      </nav>

      <div className="page-content">
        <div className="lens-header">
          <div className="lens-title">Org Chart</div>
          <div className="lens-subtitle">
            Organization → departments → positions, each filled by a person.
          </div>
        </div>

        <div className="canvas-wrap">
          <OrgChartCanvas graphData={graphData} />
        </div>

        <div className="dna-summary">
          <div className="dna-summary-header">
            <span className="dna-summary-title">About this DNA</span>
            <span className="badge badge-info">
              {nodeCount} resources · {edgeCount} relationships
            </span>
          </div>
          <p className="dna-summary-desc">{mfjFixture.description}</p>
          <div className="dna-summary-grid">
            <DnaStat label="Organization" items={companies} />
            <DnaStat label="Departments"  items={depts}     />
            <DnaStat label="Positions"    items={positions} />
            <DnaStat label="People"       items={persons}   />
          </div>

          <details className="dna-raw">
            <summary className="dna-raw-toggle">View raw DNA</summary>
            <pre className="dna-raw-pre"><code>{JSON.stringify(mfjFixture, null, 2)}</code></pre>
          </details>
          <div className="dna-summary-note">
            Fixture: <code>examples/mass-torts-org/org-chart.json</code>
          </div>
        </div>
      </div>
    </div>
  )
}

function DnaStat({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="dna-stat">
      <div className="dna-stat-label">{label}</div>
      <div className="dna-stat-items">
        {items.map(item => (
          <span key={item} className="dna-tag">{item}</span>
        ))}
      </div>
    </div>
  )
}
