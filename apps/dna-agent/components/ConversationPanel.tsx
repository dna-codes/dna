'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { WidgetPayload } from '@dna-codes/dna-mcp'
import { InlineWidget } from './InlineWidget'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
  widgets?: WidgetPayload[]
}

interface StreamChunk {
  type: 'text' | 'tool_call' | 'graph_patched' | 'error' | 'widget' | 'activate_lens'
  text?: string
  name?: string
  error?: string
  widget?: WidgetPayload
  lensId?: string
}

const PACK_WELCOME: Record<string, { content: string; placeholder: string }> = {
  operational: {
    content: "Hi — I'm your DNA Agent, loaded with the **Operational** pack.\n\nTell me about your organization — the company, departments, roles, and people — and I'll help you map it all out. Where would you like to start?",
    placeholder: 'Describe your org — roles, people, departments…',
  },
  crm: {
    content: "Hi — I'm your DNA Agent, loaded with the **CRM** pack.\n\nTell me about your sales motion — accounts, contacts, pipeline stages, and who owns what — and I'll help you model it. Where would you like to start?",
    placeholder: 'Describe your pipeline — accounts, contacts, deals…',
  },
  hr: {
    content: "Hi — I'm your DNA Agent, loaded with the **HR** pack.\n\nTell me about your team — employees, roles, departments, and open positions — and I'll help you structure it. Where would you like to start?",
    placeholder: 'Describe your team — employees, roles, open positions…',
  },
}

type SessionMode = 'build' | 'operate'

const MODE_WELCOME: Record<SessionMode, string> = {
  build: "\n\nWe're in **Build** mode — I'll help you model and mature your resource and relationship *types*, and simulate how new ones would behave before you commit any data.",
  operate: "\n\nWe're in **Operate** mode — I'll help you create and wire real instances using the existing types.",
}

function welcomeFor(pack: string, mode: SessionMode): Message {
  const w = PACK_WELCOME[pack] ?? PACK_WELCOME.operational
  return { id: 'welcome', role: 'assistant', content: w.content + MODE_WELCOME[mode] }
}

/** Join a list naturally: "a, b and c". */
function humanList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * A concise welcome derived from the *current graph* — what's actually loaded
 * (the company, its structure, and any product app). Returns null for an empty
 * graph so the static pack welcome stands.
 */
async function graphWelcome(mode: SessionMode): Promise<string | null> {
  try {
    const res = await fetch('/api/graph')
    if (!res.ok) return null
    const { nodes } = (await res.json()) as { nodes: { type: string; name: string }[] }
    if (!nodes || nodes.length === 0) return null
    const count: Record<string, number> = {}
    for (const n of nodes) count[n.type] = (count[n.type] ?? 0) + 1
    const c = (t: string) => count[t] ?? 0
    const company = nodes.find((n) => n.type === 'company')?.name
    const app = nodes.find((n) => n.type === 'App')?.name

    const parts: string[] = []
    if (c('department')) parts.push(`${c('department')} departments`)
    if (c('position')) parts.push(`${c('position')} roles`)
    if (c('process')) parts.push(`${c('process')} processes`)
    if (c('order')) parts.push(`${c('order')} orders`)
    if (parts.length === 0) return null

    const subject = company ? `**${company}**` : 'your graph'
    let s = `Hi — I'm your DNA Agent, working with ${subject} — ${humanList(parts)}`
    if (app) s += `, plus the **${app}** product app`
    s += '. '
    s += mode === 'build'
      ? 'Ask about the type model, or tell me how to evolve it.'
      : 'Ask about the org, processes, or the app — or tell me what to change.'
    return s
  } catch {
    return null
  }
}

interface ConversationPanelProps {
  pack: string
  mode: SessionMode
  refreshSignal: number
  onGraphPatched: () => void
  onReset: () => void
  onSaveLens?: (name: string, widget: WidgetPayload) => void
  onActivateLens?: (lensId: string) => void
}

export function ConversationPanel({ pack, mode, refreshSignal, onGraphPatched, onReset, onSaveLens, onActivateLens }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => [welcomeFor(pack, mode)])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([welcomeFor(pack, mode)])
  }, [pack, mode])

  // Enhance the opening message with a concise summary of the current graph
  // (e.g. after loading an example). Only while the conversation hasn't started.
  useEffect(() => {
    let cancelled = false
    graphWelcome(mode).then((content) => {
      if (cancelled || !content) return
      setMessages(prev => (prev.length === 1 && prev[0].id === 'welcome'
        ? [{ id: 'welcome', role: 'assistant', content }]
        : prev))
    })
    return () => { cancelled = true }
  }, [pack, mode, refreshSignal])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTools])

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setIsStreaming(true)
    setActiveTools([])

    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', toolCalls: [] }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const chunk = JSON.parse(line) as StreamChunk
            if (chunk.type === 'text' && chunk.text) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + chunk.text } : m
                )
              )
            } else if (chunk.type === 'tool_call' && chunk.name) {
              setActiveTools(prev => [...prev, chunk.name!])
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, toolCalls: [...(m.toolCalls ?? []), chunk.name!] }
                    : m
                )
              )
            } else if (chunk.type === 'activate_lens' && chunk.lensId) {
              onActivateLens?.(chunk.lensId)
            } else if (chunk.type === 'widget' && chunk.widget) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, widgets: [...(m.widgets ?? []), chunk.widget!] }
                    : m
                )
              )
            } else if (chunk.type === 'graph_patched') {
              onGraphPatched()
            } else if (chunk.type === 'error') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + `\n\nError: ${chunk.error}` } : m
                )
              )
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, content: `Error: ${String(err)}` } : m
        )
      )
    } finally {
      setIsStreaming(false)
      setActiveTools([])
      inputRef.current?.focus()
    }
  }

  async function handleReset() {
    if (isStreaming) return
    await fetch('/api/reset', { method: 'POST' })
    setMessages([welcomeFor(pack, mode)])
    setInput('')
    setActiveTools([])
    onReset()
    inputRef.current?.focus()
  }

  const toolLabel: Record<string, string> = {
    get_type_registry: 'Loading type registry…',
    query_instances: 'Querying graph…',
    get_links: 'Traversing edges…',
    patch_graph: 'Updating graph…',
    get_lens: 'Rendering view…',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Message list */}
      <div className="conversation-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map(msg => (
          <div key={msg.id}>
            {/* Tool call progress lines */}
            {msg.role === 'assistant' && (msg.toolCalls ?? []).length > 0 && (
              <div style={{ marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {(msg.toolCalls ?? []).map((tool, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                    ✓ {toolLabel[tool] ?? tool}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                maxWidth: '90%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginLeft: msg.role === 'user' ? 'auto' : 0,
                background: msg.role === 'user' ? 'rgba(13,148,136,0.2)' : 'var(--card-bg)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(13,148,136,0.4)' : 'var(--border)'}`,
                borderRadius: '0.75rem',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}
              className={msg.role === 'assistant' ? 'md-prose' : undefined}
            >
              {msg.role === 'user' ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </span>
              ) : msg.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              ) : isStreaming ? '…' : ''}
              {msg.role === 'assistant' && (msg.widgets ?? []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
                  {(msg.widgets ?? []).map((w, i) => (
                    <InlineWidget
                      key={i}
                      widget={w}
                      onSave={onSaveLens ? (name) => onSaveLens(name, w) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Active tool progress */}
        {isStreaming && activeTools.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace', animation: 'pulse 1s ease-in-out infinite' }}>
            ◈ {toolLabel[activeTools[activeTools.length - 1]] ?? activeTools[activeTools.length - 1]}
            <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.5rem',
          background: 'var(--panel-bg)',
        }}
      >
        <input
          ref={inputRef}
          data-ui-input=""
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={(PACK_WELCOME[pack] ?? PACK_WELCOME.operational).placeholder}
          disabled={isStreaming}
          style={{ flex: 1 }}
        />
        <button
          data-ui-button=""
          data-variant="primary"
          data-size="sm"
          type="submit"
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? '…' : 'Send'}
        </button>
        <button
          data-ui-button=""
          data-variant="ghost"
          data-size="sm"
          type="button"
          onClick={handleReset}
          disabled={isStreaming}
          title="Reset conversation and wipe graph"
        >
          ↺
        </button>
      </form>
    </div>
  )
}
