'use client'

import { useState, useRef, useEffect } from 'react'
import type { WidgetPayload, StatRow, RecordTable, RecordCard, BadgeList } from '@dna-codes/dna-mcp'

interface WidgetShellProps {
  children: React.ReactNode
  onSave?: (name: string) => void
}

function WidgetShell({ children, onSave }: WidgetShellProps) {
  const [saving, setSaving] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (saving) inputRef.current?.focus()
  }, [saving])

  function handleConfirm() {
    const trimmed = nameInput.trim()
    if (trimmed) {
      onSave?.(trimmed)
    }
    setSaving(false)
    setNameInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') { setSaving(false); setNameInput('') }
  }

  return (
    <div style={{ position: 'relative' }}>
      {children}
      {onSave && (
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {saving ? (
            <>
              <input
                ref={inputRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (!nameInput.trim()) { setSaving(false); setNameInput('') } }}
                placeholder="Lens name…"
                data-ui-input=""
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', width: '7rem', height: '1.5rem' }}
              />
              <button
                data-ui-button=""
                data-variant="primary"
                data-size="sm"
                onClick={handleConfirm}
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', height: '1.5rem', lineHeight: 1 }}
                title="Save as lens"
              >
                ✓
              </button>
            </>
          ) : (
            <button
              data-ui-button=""
              data-variant="ghost"
              data-size="sm"
              onClick={() => setSaving(true)}
              style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem', height: '1.4rem', lineHeight: 1, opacity: 0.5 }}
              title="Save as lens"
            >
              ⊞
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function StatRowWidget({ widget }: { widget: StatRow }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--ui-space-2)', flexWrap: 'wrap', marginTop: 'var(--ui-space-2)' }}>
      {widget.stats.map((stat, i) => (
        <div
          key={i}
          data-ui-card=""
          style={{
            padding: 'var(--ui-space-2) var(--ui-space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.125rem',
            minWidth: '5rem',
          }}
        >
          <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)', lineHeight: 1.2 }}>
            {stat.label}
          </span>
          <span style={{
            fontSize: 'var(--ui-font-size-lg)',
            fontWeight: 'var(--ui-font-weight-semibold)',
            color: stat.accent ?? 'var(--ui-color-text)',
            lineHeight: 1.2,
          }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function RecordTableWidget({ widget }: { widget: RecordTable }) {
  return (
    <div style={{ marginTop: 'var(--ui-space-2)', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--ui-font-size-xs)' }}>
        <thead>
          <tr>
            {widget.columns.map((col, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                <span data-ui-tag="" data-variant="primary">{col}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {widget.rows.map((row, ri) => (
            <tr key={ri}>
              {widget.columns.map((_, ci) => (
                <td key={ci} style={{ padding: '0.25rem 0.5rem', color: 'var(--ui-color-text-muted)', borderBottom: '1px solid var(--border)' }}>
                  {row[ci] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecordCardWidget({ widget }: { widget: RecordCard }) {
  return (
    <div data-ui-card="" style={{ padding: 'var(--ui-space-3)', marginTop: 'var(--ui-space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
      <div>
        <div style={{ fontWeight: 'var(--ui-font-weight-semibold)', fontSize: 'var(--ui-font-size-sm)' }}>{widget.title}</div>
        {widget.subtitle && (
          <div style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>{widget.subtitle}</div>
        )}
      </div>
      {widget.fields.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.125rem 0.75rem' }}>
          {widget.fields.map((f, i) => (
            <>
              <span key={`l${i}`} style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)', whiteSpace: 'nowrap' }}>
                {f.label}
              </span>
              <span key={`v${i}`} style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text)' }}>
                {f.value}
              </span>
            </>
          ))}
        </div>
      )}
    </div>
  )
}

function BadgeListWidget({ widget }: { widget: BadgeList }) {
  return (
    <div style={{ marginTop: 'var(--ui-space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
      {widget.label && (
        <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>{widget.label}</span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-1)' }}>
        {widget.items.map((item, i) => (
          <span key={i} data-ui-badge="" data-variant={item.variant ?? 'neutral'}>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}

interface InlineWidgetProps {
  widget: WidgetPayload
  onSave?: (name: string) => void
}

export function InlineWidget({ widget, onSave }: InlineWidgetProps) {
  let inner: React.ReactNode
  switch (widget.kind) {
    case 'stat-row':
      inner = <StatRowWidget widget={widget} />
      break
    case 'record-table':
      inner = <RecordTableWidget widget={widget} />
      break
    case 'record-card':
      inner = <RecordCardWidget widget={widget} />
      break
    case 'badge-list':
      inner = <BadgeListWidget widget={widget} />
      break
    default:
      return null
  }

  return <WidgetShell onSave={onSave}>{inner}</WidgetShell>
}
