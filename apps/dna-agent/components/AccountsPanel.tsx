'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { AccountsViewModel, AccountEntry } from '@dna-codes/dna-mcp'

interface AccountsPanelProps {
  refreshSignal: number
}

function AccountCard({ account }: { account: AccountEntry }) {
  const open = account.opportunities.filter(o => o.status === 'open').length
  const closed = account.opportunities.filter(o => o.status === 'closed').length

  return (
    <div data-ui-card="" style={{ padding: 'var(--ui-space-3)', gap: 'var(--ui-space-2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--ui-space-2)' }}>
        <span style={{ fontWeight: 'var(--ui-font-weight-semibold)', fontSize: 'var(--ui-font-size-sm)' }}>{account.name}</span>
        {account.owner && (
          <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-primary)', whiteSpace: 'nowrap' }}>{account.owner}</span>
        )}
      </div>

      {account.opportunities.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--ui-space-1)', flexWrap: 'wrap' }}>
          {open > 0 && <span data-ui-badge="">{open} open</span>}
          {closed > 0 && <span data-ui-badge="" data-variant="success">{closed} closed</span>}
        </div>
      )}

      {account.opportunities.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {account.opportunities.map(opp => (
            <span key={opp.id} style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>
              {opp.status === 'closed' ? '✓' : '·'} {opp.name}
            </span>
          ))}
        </div>
      )}

      {account.activityCount > 0 && (
        <span style={{ fontSize: 'var(--ui-font-size-xs)', color: 'var(--ui-color-text-muted)' }}>
          {account.activityCount} {account.activityCount === 1 ? 'activity' : 'activities'}
        </span>
      )}
    </div>
  )
}

export function AccountsPanel({ refreshSignal }: AccountsPanelProps) {
  const [viewModel, setViewModel] = useState<AccountsViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFirstLoad = useRef(true)

  const fetchAccounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/lens/accounts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setViewModel(await res.json() as AccountsViewModel)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      fetchAccounts(false)
    } else {
      fetchAccounts(true)
    }
  }, [fetchAccounts, refreshSignal])

  if (loading) {
    return (
      <div style={{ padding: 'var(--ui-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
        {[1, 2, 3].map(i => <div key={i} data-ui-skeleton="" style={{ height: '4rem' }} />)}
      </div>
    )
  }

  if (error) {
    return <div style={{ padding: '1rem', color: 'rgba(248,113,113,0.9)', fontSize: '0.875rem' }}>Could not load accounts: {error}</div>
  }

  if (!viewModel || viewModel.accounts.length === 0) {
    return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No accounts yet. Tell me about the companies in your pipeline.</div>
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <p style={{
        fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.75rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        {viewModel.accounts.length} {viewModel.accounts.length === 1 ? 'account' : 'accounts'}
        {refreshing && (
          <span style={{ fontSize: '0.625rem', color: 'var(--primary)', animation: 'pulse 1s ease-in-out infinite' }}>
            ◈ updating
            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
          </span>
        )}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {viewModel.accounts.map(acc => (
          <AccountCard key={acc.id} account={acc} />
        ))}
      </div>
    </div>
  )
}
