'use client'

import { useState } from 'react'

const PACKS = [
  {
    name: 'operational' as const,
    label: 'Operational',
    description: 'Org structure, reporting chains, and workflow mapping.',
    types: ['person', 'position', 'department', 'company', 'process', 'step'],
  },
  {
    name: 'crm' as const,
    label: 'CRM',
    description: 'Sales pipelines and customer relationship tracking.',
    types: ['contact', 'account', 'opportunity', 'deal', 'activity'],
  },
  {
    name: 'hr' as const,
    label: 'HR',
    description: 'People-ops, headcount planning, and recruitment.',
    types: ['employee', 'role', 'department', 'team', 'job-posting'],
  },
]

type PackName = 'operational' | 'crm' | 'hr'

interface SessionSetupModalProps {
  onComplete: (pack: PackName, locked: boolean) => Promise<void>
}

export function SessionSetupModal({ onComplete }: SessionSetupModalProps) {
  const [selectedPack, setSelectedPack] = useState<PackName>('operational')
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await onComplete(selectedPack, locked)
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'var(--ui-color-overlay)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--ui-space-4)',
    }}>
      <div data-ui-card="" style={{ width: '100%', maxWidth: 520 }}>
        <div data-ui-card-header="">
          <h2 data-ui-card-title="" style={{ fontSize: 'var(--ui-font-size-md)' }}>Start a new session</h2>
          <p data-ui-card-description="">Choose a starter pack to seed your type vocabulary.</p>
        </div>

        <div data-ui-card-body="" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
          {/* Pack cards */}
          {PACKS.map(pack => {
            const active = selectedPack === pack.name
            return (
              <button
                key={pack.name}
                data-ui-card=""
                onClick={() => setSelectedPack(pack.name)}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  padding: 'var(--ui-space-3) var(--ui-space-4)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)',
                  background: active ? 'var(--ui-color-selection)' : undefined,
                  borderColor: active ? 'var(--ui-color-primary)' : undefined,
                  borderStyle: active ? 'solid' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
                  <span style={{
                    fontSize: 'var(--ui-font-size-sm)',
                    fontWeight: 'var(--ui-font-weight-semibold)',
                    color: active ? 'var(--ui-color-primary)' : 'var(--ui-color-text)',
                  }}>
                    {pack.label}
                  </span>
                  {active && <span data-ui-badge="" data-variant="primary">selected</span>}
                </div>
                <p style={{ margin: 0, fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>
                  {pack.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-1)' }}>
                  {pack.types.map(t => (
                    <span key={t} data-ui-tag="" data-variant={active ? 'primary' : undefined}>{t}</span>
                  ))}
                </div>
              </button>
            )
          })}

          {/* Governance */}
          <div
            data-ui-card=""
            style={{
              padding: 'var(--ui-space-3) var(--ui-space-4)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--ui-space-4)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
              <span style={{ fontSize: 'var(--ui-font-size-sm)', fontWeight: 'var(--ui-font-weight-semibold)' }}>
                Type governance
              </span>
              <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>
                {locked
                  ? 'Locked — agent cannot create new types.'
                  : 'Open — agent can propose and create new types.'}
              </span>
            </div>
            <button
              data-ui-button=""
              data-variant={locked ? 'outline' : 'ghost'}
              data-size="sm"
              onClick={() => setLocked(l => !l)}
              style={{ flexShrink: 0, borderColor: locked ? 'var(--ui-color-primary)' : undefined, color: locked ? 'var(--ui-color-primary)' : undefined }}
            >
              {locked ? '🔒 Locked' : '🔓 Open'}
            </button>
          </div>

          {error && (
            <div style={{
              fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-danger)',
              padding: 'var(--ui-space-2) var(--ui-space-3)',
              background: 'rgb(251 113 133 / 0.08)',
              borderRadius: 'var(--ui-radius-md)',
              border: '1px solid rgb(251 113 133 / 0.2)',
            }}>
              {error}
            </div>
          )}
        </div>

        <div data-ui-card-footer="">
          <button
            data-ui-button=""
            data-variant="primary"
            data-size="lg"
            disabled={loading}
            onClick={handleConfirm}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Starting session…' : 'Start session'}
          </button>
        </div>
      </div>
    </div>
  )
}
