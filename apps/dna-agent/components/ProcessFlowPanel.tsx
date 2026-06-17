'use client'

import { Fragment, useEffect, useState } from 'react'
import type { ProcessFlowViewModel } from '@dna-codes/dna-mcp'

/**
 * Process Flow lens — how each process flows through its steps (ordered by
 * `next_step`), with the position that owns each step. Read-only. Teal (the brand
 * primary) marks flow: the process accent, the step numbers, and the connectors.
 */
export function ProcessFlowPanel({ refreshSignal }: { refreshSignal: number }) {
  const [vm, setVm] = useState<ProcessFlowViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/lens/process-flow')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load process flow'))))
      .then((d: ProcessFlowViewModel) => { if (!cancelled) { setVm(d); setError(null) } })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshSignal])

  if (loading) return <div style={{ padding: '1rem', color: 'var(--ui-color-text-muted)' }}>Loading process flow…</div>
  if (error) return <div style={{ padding: '1rem', color: 'var(--ui-color-danger, crimson)' }}>{error}</div>
  if (!vm || vm.processes.length === 0) {
    return <div style={{ padding: '1rem', color: 'var(--ui-color-text-muted)', fontStyle: 'italic' }}>No processes yet — add a process with steps to see its flow.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)', padding: 'var(--ui-space-4)', overflowY: 'auto', height: '100%' }}>
      {vm.processes.map((proc) => (
        <section
          key={proc.id}
          data-ui-card=""
          style={{ padding: 0, flexShrink: 0, overflow: 'hidden', borderLeft: '3px solid var(--ui-color-primary)' }}
        >
          {/* Process header — teal-tinted band */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)',
            padding: 'var(--ui-space-3) var(--ui-space-4)',
            background: 'var(--ui-color-selection)',
            borderBottom: '1px solid var(--ui-color-border)',
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--ui-font-size-md, 1rem)', fontWeight: 'var(--ui-font-weight-semibold)' }}>{proc.name}</h3>
            <span data-ui-badge="" data-variant="primary" style={{ marginLeft: 'auto' }}>{proc.steps.length} steps</span>
          </div>

          <div style={{ padding: 'var(--ui-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
            {proc.description && (
              <p style={{ margin: 0, fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>{proc.description}</p>
            )}
            <ol style={{ listStyle: 'none', margin: 0, padding: '2px 2px 16px', display: 'flex', flexWrap: 'nowrap', alignItems: 'stretch', gap: 'var(--ui-space-1)', overflowX: 'auto' }}>
              {proc.steps.map((step, i) => (
                <Fragment key={step.id}>
                  {i > 0 && (
                    <li aria-hidden style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--ui-color-primary)', fontSize: '1.1rem', padding: '0 0.1rem' }}>→</li>
                  )}
                  <li style={{
                    display: 'flex', flexDirection: 'column', gap: '0.3rem',
                    width: 168, flexShrink: 0, padding: 'var(--ui-space-2) var(--ui-space-3)',
                    background: 'var(--ui-color-surface-raised, var(--ui-color-surface))',
                    border: '1px solid var(--ui-color-border)',
                    borderRadius: 'var(--ui-radius-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{
                        flexShrink: 0,
                        width: '1.15rem', height: '1.15rem', borderRadius: '999px',
                        background: 'var(--ui-color-primary)', color: 'var(--ui-color-on-primary)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 'var(--ui-font-weight-semibold)',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 'var(--ui-font-size-sm)', fontWeight: 'var(--ui-font-weight-semibold)', lineHeight: 1.2 }}>{step.name}</span>
                    </div>
                    {step.description && (
                      <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)', lineHeight: 1.35 }}>{step.description}</span>
                    )}
                    {step.assignee && (
                      <span style={{
                        alignSelf: 'flex-start', marginTop: '0.1rem',
                        fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: 'var(--ui-radius-pill, 999px)',
                        background: 'var(--ui-color-selection)', color: 'var(--ui-color-primary)',
                        fontWeight: 'var(--ui-font-weight-medium)',
                      }}>{step.assignee}</span>
                    )}
                  </li>
                </Fragment>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  )
}
