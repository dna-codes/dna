'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ConversationPanel } from '@/components/ConversationPanel'
import { LensPanelShell } from '@/components/LensPanelShell'
import { SessionSetupModal } from '@/components/SessionSetupModal'
import { loadSavedLenses, persistSavedLenses, clearSavedLenses, type SavedLens } from '@/lib/saved-lenses'
import type { WidgetPayload } from '@dna-codes/dna-mcp'

const MIN_PCT = 20
const MAX_PCT = 80

type PackName = 'operational' | 'crm' | 'hr'
type SessionMode = 'build' | 'operate'

export default function HomePage() {
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [leftPct, setLeftPct] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [setupDone, setSetupDone] = useState(false)
  const [sessionConfig, setSessionConfig] = useState<{ pack: PackName; mode: SessionMode }>({ pack: 'operational', mode: 'build' })
  // Mode is owned by the server; unknown until the initial session-config fetch resolves.
  const [modeLoading, setModeLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(true)
  const [savedLenses, setSavedLenses] = useState<SavedLens[]>(() => loadSavedLenses())
  const [agentLens, setAgentLens] = useState<{ lensId: string; seq: number } | null>(null)
  const agentLensSeq = useRef(0)

  useEffect(() => {
    persistSavedLenses(savedLenses)
  }, [savedLenses])

  // The server session-config is the single source of truth for mode. Read it on
  // mount; the mode control shows a loading state until this resolves.
  useEffect(() => {
    let cancelled = false
    fetch('/api/session-config')
      .then(res => (res.ok ? res.json() : null))
      .then(cfg => {
        if (cancelled || !cfg) return
        setSessionConfig(c => ({
          pack: (cfg.pack as PackName) ?? c.pack,
          mode: cfg.mode === 'operate' ? 'operate' : 'build',
        }))
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => { if (!cancelled) setModeLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleGraphPatched = useCallback(() => {
    setRefreshSignal(n => n + 1)
  }, [])

  const handleSaveLens = useCallback((name: string, widget: WidgetPayload) => {
    setSavedLenses(prev => [...prev, { id: crypto.randomUUID(), name, widget, savedAt: Date.now() }])
  }, [])

  const handleRemoveLens = useCallback((id: string) => {
    setSavedLenses(prev => prev.filter(l => l.id !== id))
  }, [])

  const handleActivateLens = useCallback((lensId: string) => {
    setAgentLens({ lensId, seq: ++agentLensSeq.current })
  }, [])

  const handleReset = useCallback(() => {
    setSavedLenses([])
    clearSavedLenses()
    setNeedsSetup(true)
    setSetupDone(false)
    setRefreshSignal(n => n + 1)
  }, [])

  const handleSetupComplete = useCallback(async (pack: PackName, mode: SessionMode, exampleId?: string) => {
    if (exampleId) {
      // Loading an example resets the store and seeds the full example graph.
      const res = await fetch('/api/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exampleId }),
      })
      if (!res.ok) throw new Error('Failed to load example')
      await fetch('/api/session-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }),
      })
    } else {
      // Start the session by setting pack/mode only — do NOT wipe the graph here.
      // The store is already seeded on the server (pack types on boot); resetting
      // on every session start would destroy seeded/example data on each reload.
      // Use the explicit reset control to start a fresh graph on purpose.
      const res = await fetch('/api/session-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, mode }),
      })
      if (!res.ok) throw new Error('Failed to start session')
    }
    setSessionConfig({ pack, mode })
    setModeLoading(false)
    setSetupDone(true)
    setNeedsSetup(false)
    setRefreshSignal(n => n + 1)
  }, [])

  const handleModeChange = useCallback(async (mode: SessionMode) => {
    if (mode === sessionConfig.mode) return
    const res = await fetch('/api/session-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    // Switching mode does not reset the graph — only prompt, allowed ops, and lenses change.
    if (res.ok) setSessionConfig(c => ({ ...c, mode }))
  }, [sessionConfig.mode])

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(MAX_PCT, Math.max(MIN_PCT, pct)))
    }

    const onMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <>
      {needsSetup && <SessionSetupModal onComplete={handleSetupComplete} />}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          userSelect: isDragging ? 'none' : undefined,
          cursor: isDragging ? 'col-resize' : undefined,
        }}
      >
      {/* Left: Conversation */}
      <div
        style={{
          width: `${leftPct}%`,
          flexShrink: 0,
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--panel-bg)',
        }}
      >
        <div
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            DNA Agent
          </span>
          {setupDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
              <span data-ui-badge="">{sessionConfig.pack}</span>
              {modeLoading ? (
                <span
                  style={{ fontSize: '0.7rem', color: 'var(--ui-color-text-muted)', fontFamily: 'monospace', animation: 'pulse 1s ease-in-out infinite' }}
                  title="Loading mode…"
                >
                  ◈ mode…
                  <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
                </span>
              ) : (
                <div data-ui-button-group="" style={{ display: 'inline-flex' }} role="group" aria-label="Session mode">
                  {(['build', 'operate'] as const).map(m => {
                    const active = sessionConfig.mode === m
                    return (
                      <button
                        key={m}
                        data-ui-button=""
                        data-variant={active ? 'primary' : 'ghost'}
                        data-size="sm"
                        aria-pressed={active}
                        onClick={() => handleModeChange(m)}
                        title={m === 'build' ? 'Build — model and mature types' : 'Operate — run operations on instances'}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {m === 'build' ? '🧬 Build' : '⚙️ Operate'}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ConversationPanel pack={sessionConfig.pack} mode={sessionConfig.mode} refreshSignal={refreshSignal} onGraphPatched={handleGraphPatched} onReset={handleReset} onSaveLens={handleSaveLens} onActivateLens={handleActivateLens} />
        </div>
      </div>

      {/* Draggable divider */}
      <div
        className={`panel-divider${isDragging ? ' dragging' : ''}`}
        onMouseDown={onDividerMouseDown}
      />

      {/* Right: Live Lenses */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        <LensPanelShell pack={sessionConfig.pack} mode={sessionConfig.mode} refreshSignal={refreshSignal} savedLenses={savedLenses} onRemoveLens={handleRemoveLens} agentLens={agentLens} />
      </div>
    </div>
    </>
  )
}
