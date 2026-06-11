import Link from 'next/link'
import { EXAMPLES } from '../lib/examples'

export default function HomePage() {
  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-brand">DNA <span>Graph Studio</span></div>
      </nav>

      <div className="hero">
        <h1>Visual <span>lenses</span> into your DNA</h1>
        <p>One DNA fixture, many views. Explore org structure, process flow, and operational runbooks across three domains.</p>
      </div>

      <div className="example-grid">
        {EXAMPLES.map(example => (
          <div key={example.id} className="example-card">
            <div className="example-card-title">{example.label}</div>
            <div className="example-card-desc">{example.description}</div>
            <div className="example-card-lenses">
              {example.lenses.map(lens => (
                <Link key={lens.id} href={lens.href} className="lens-pill">
                  {lens.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
