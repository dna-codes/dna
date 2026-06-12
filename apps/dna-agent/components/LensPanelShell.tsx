'use client'

import { useState, useEffect } from 'react'
import { OrgChartPanel } from './OrgChartPanel'
import { PeoplePositionsPanel } from './PeoplePositionsPanel'
import { ReportingChainsPanel } from './ReportingChainsPanel'
import { SpanOfControlPanel } from './SpanOfControlPanel'
import { GraphExplorer } from './GraphExplorer'
import { JobDescriptionsPanel } from './JobDescriptionsPanel'
import { PipelinePanel } from './PipelinePanel'
import { AccountsPanel } from './AccountsPanel'
import { InlineWidget } from './InlineWidget'
import type { SavedLens } from '@/lib/saved-lenses'

interface TabDef {
  id: string
  label: string
  render: (refreshSignal: number) => React.ReactNode
}

const PACK_TABS: Record<string, TabDef[]> = {
  operational: [
    { id: 'org-chart',         label: 'Org Chart',         render: s => <OrgChartPanel refreshSignal={s} /> },
    { id: 'people-positions',  label: 'People & Positions', render: s => <PeoplePositionsPanel refreshSignal={s} /> },
    { id: 'reporting-chains',  label: 'Reporting Chains',  render: s => <ReportingChainsPanel refreshSignal={s} /> },
    { id: 'span-of-control',   label: 'Span of Control',   render: s => <SpanOfControlPanel refreshSignal={s} /> },
    { id: 'job-descriptions',  label: 'Job Descriptions',  render: s => <JobDescriptionsPanel refreshSignal={s} /> },
    { id: 'graph-explorer',    label: 'Graph Explorer',    render: s => <GraphExplorer refreshSignal={s} /> },
  ],
  crm: [
    { id: 'pipeline',       label: 'Pipeline',      render: s => <PipelinePanel refreshSignal={s} /> },
    { id: 'accounts',       label: 'Accounts',      render: s => <AccountsPanel refreshSignal={s} /> },
    { id: 'graph-explorer', label: 'Graph Explorer', render: s => <GraphExplorer refreshSignal={s} /> },
  ],
  hr: [
    { id: 'org-chart',        label: 'Org Chart',       render: s => <OrgChartPanel refreshSignal={s} /> },
    { id: 'roster',           label: 'Roster',           render: s => <PeoplePositionsPanel refreshSignal={s} /> },
    { id: 'reporting-chains', label: 'Reporting Chains', render: s => <ReportingChainsPanel refreshSignal={s} /> },
    { id: 'open-positions',   label: 'Open Positions',   render: s => <JobDescriptionsPanel refreshSignal={s} /> },
    { id: 'graph-explorer',   label: 'Graph Explorer',   render: s => <GraphExplorer refreshSignal={s} /> },
  ],
}

interface LensPanelShellProps {
  pack: string
  refreshSignal: number
  savedLenses: SavedLens[]
  onRemoveLens: (id: string) => void
  agentLens?: { lensId: string; seq: number } | null
}

export function LensPanelShell({ pack, refreshSignal, savedLenses, onRemoveLens, agentLens }: LensPanelShellProps) {
  const packTabs = PACK_TABS[pack] ?? PACK_TABS.operational
  const [activeTab, setActiveTab] = useState(packTabs[0].id)

  // Reset to first pack tab when pack changes
  useEffect(() => {
    const newTabs = PACK_TABS[pack] ?? PACK_TABS.operational
    setActiveTab(newTabs[0].id)
  }, [pack])

  // If the active tab was a saved lens that got removed, fall back to first pack tab
  useEffect(() => {
    const isPackTab = packTabs.some(t => t.id === activeTab)
    const isSavedTab = savedLenses.some(l => l.id === activeTab)
    if (!isPackTab && !isSavedTab) {
      setActiveTab(packTabs[0].id)
    }
  }, [savedLenses, activeTab, packTabs])

  // Agent-driven tab switch — only honor if the lensId is valid for current pack or saved lenses
  useEffect(() => {
    if (!agentLens) return
    const isPackTab = packTabs.some(t => t.id === agentLens.lensId)
    const isSavedTab = savedLenses.some(l => l.id === agentLens.lensId)
    if (isPackTab || isSavedTab) {
      setActiveTab(agentLens.lensId)
    }
  }, [agentLens, packTabs, savedLenses])

  const activePackTab = packTabs.find(t => t.id === activeTab)
  const activeSavedLens = savedLenses.find(l => l.id === activeTab)

  return (
    <div data-ui-tabs="" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div
        data-ui-tabs-list=""
        style={{ overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', gap: 0 }}
      >
        {/* Pack-defined tabs */}
        {packTabs.map(tab => (
          <button
            key={tab.id}
            data-ui-tabs-trigger=""
            data-state={activeTab === tab.id ? 'active' : 'inactive'}
            onClick={() => setActiveTab(tab.id)}
            style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {tab.label}
          </button>
        ))}

        {/* Saved lens tabs */}
        {savedLenses.map(lens => (
          <button
            key={lens.id}
            data-ui-tabs-trigger=""
            data-state={activeTab === lens.id ? 'active' : 'inactive'}
            onClick={() => setActiveTab(lens.id)}
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              paddingRight: '0.375rem',
            }}
          >
            {lens.name}
            <span
              role="button"
              tabIndex={-1}
              onClick={e => { e.stopPropagation(); onRemoveLens(lens.id) }}
              style={{
                lineHeight: 1,
                fontSize: '0.65rem',
                color: 'var(--ui-color-text-muted)',
                cursor: 'pointer',
                padding: '0.1rem 0.2rem',
                borderRadius: '0.2rem',
              }}
              title="Remove lens"
            >
              ✕
            </span>
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activePackTab
          ? activePackTab.render(refreshSignal)
          : activeSavedLens
            ? (
              <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {activeSavedLens.name}
                </p>
                <InlineWidget widget={activeSavedLens.widget} />
              </div>
            )
            : null
        }
      </div>
    </div>
  )
}
