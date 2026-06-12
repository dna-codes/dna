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
}

export function LensPanelShell({ pack, refreshSignal }: LensPanelShellProps) {
  const tabs = PACK_TABS[pack] ?? PACK_TABS.operational
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  useEffect(() => {
    const newTabs = PACK_TABS[pack] ?? PACK_TABS.operational
    setActiveTab(newTabs[0].id)
  }, [pack])

  const activeTabDef = tabs.find(t => t.id === activeTab) ?? tabs[0]

  return (
    <div data-ui-tabs="" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div
        data-ui-tabs-list=""
        style={{ overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', gap: 0 }}
      >
        {tabs.map(tab => (
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
      </div>

      {/* Active panel */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTabDef.render(refreshSignal)}
      </div>
    </div>
  )
}
