'use client'

import type { WidgetPayload, StatRow, RecordTable, RecordCard, BadgeList } from '@dna-codes/dna-mcp'

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

export function InlineWidget({ widget }: { widget: WidgetPayload }) {
  switch (widget.kind) {
    case 'stat-row':
      return <StatRowWidget widget={widget} />
    case 'record-table':
      return <RecordTableWidget widget={widget} />
    case 'record-card':
      return <RecordCardWidget widget={widget} />
    case 'badge-list':
      return <BadgeListWidget widget={widget} />
    default:
      return null
  }
}
