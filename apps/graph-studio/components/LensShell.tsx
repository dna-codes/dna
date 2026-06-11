import Link from 'next/link'
import { EXAMPLES } from '../lib/examples'
import { themeToVars } from '../lib/canvas-theme'
import type { FixtureTheme } from '../lib/canvas-theme'

interface Props {
  exampleLabel: string
  lensLabel:    string
  exampleId?:   string
  lensId?:      string
  theme?:       FixtureTheme
  children:     React.ReactNode
}

export default function LensShell({ exampleLabel, lensLabel, exampleId, lensId, theme, children }: Props) {
  const example  = exampleId ? EXAMPLES.find(e => e.id === exampleId) : undefined
  const cssVars  = theme ? themeToVars(theme) : undefined

  return (
    <div className="page" style={cssVars as React.CSSProperties}>
      <nav className="nav">
        <div className="nav-brand">DNA <span>Graph Studio</span></div>
        <Link href="/" className="nav-back">← All examples</Link>
      </nav>
      <div className="page-content">
        <div className="lens-header">
          <div className="lens-title">{lensLabel}</div>
          <div className="lens-subtitle">{exampleLabel}</div>
        </div>

        {example && (
          <div className="lens-switcher">
            {example.lenses.map(lens => (
              <Link
                key={lens.id}
                href={lens.href}
                className={`lens-switch-pill${lens.id === lensId ? ' active' : ''}`}
              >
                {lens.label}
              </Link>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
