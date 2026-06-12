'use client'

import { useState, useCallback, useRef } from 'react'
import { ConversationPanel } from '@/components/ConversationPanel'
import { LensPanelShell } from '@/components/LensPanelShell'
import { SessionSetupModal } from '@/components/SessionSetupModal'

const MIN_PCT = 20
const MAX_PCT = 80

type PackName = 'operational' | 'crm' | 'hr'

export default function HomePage() {
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [leftPct, setLeftPct] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [setupDone, setSetupDone] = useState(false)
  const [sessionConfig, setSessionConfig] = useState<{ pack: PackName; locked: boolean }>({ pack: 'operational', locked: false })
  const [needsSetup, setNeedsSetup] = useState(true)

  const handleGraphPatched = useCallback(() => {
    setRefreshSignal(n => n + 1)
  }, [])

  const handleReset = useCallback(() => {
    setNeedsSetup(true)
    setSetupDone(false)
    setRefreshSignal(n => n + 1)
  }, [])

  const handleSetupComplete = useCallback(async (pack: PackName, locked: boolean) => {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack, locked }),
    })
    if (!res.ok) throw new Error('Failed to start session')
    setSessionConfig({ pack, locked })
    setSetupDone(true)
    setNeedsSetup(false)
    setRefreshSignal(n => n + 1)
  }, [])

  const handleLockToggle = useCallback(async () => {
    const newLocked = !sessionConfig.locked
    const res = await fetch('/api/session-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked: newLocked }),
    })
    if (res.ok) setSessionConfig(c => ({ ...c, locked: newLocked }))
  }, [sessionConfig.locked])

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
              <button
                data-ui-button=""
                data-variant={sessionConfig.locked ? 'outline' : 'ghost'}
                data-size="sm"
                onClick={handleLockToggle}
                title={sessionConfig.locked ? 'Locked — click to open' : 'Open — click to lock'}
                style={{ borderColor: sessionConfig.locked ? 'var(--ui-color-primary)' : undefined, color: sessionConfig.locked ? 'var(--ui-color-primary)' : undefined }}
              >
                {sessionConfig.locked ? '🔒 locked' : '🔓 open'}
              </button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ConversationPanel pack={sessionConfig.pack} onGraphPatched={handleGraphPatched} onReset={handleReset} />
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
        <LensPanelShell pack={sessionConfig.pack} refreshSignal={refreshSignal} />
      </div>
    </div>
    </>
  )
}
