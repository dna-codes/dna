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
  type: 'text' | 'tool_call' | 'graph_patched' | 'error' | 'widget'
  text?: string
  name?: string
  error?: string
  widget?: WidgetPayload
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

function welcomeForPack(pack: string): Message {
  const w = PACK_WELCOME[pack] ?? PACK_WELCOME.operational
  return { id: 'welcome', role: 'assistant', content: w.content }
}

interface ConversationPanelProps {
  pack: string
  onGraphPatched: () => void
  onReset: () => void
}

export function ConversationPanel({ pack, onGraphPatched, onReset }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => [welcomeForPack(pack)])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([welcomeForPack(pack)])
  }, [pack])

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
    }
  }

  async function handleReset() {
    if (isStreaming) return
    await fetch('/api/reset', { method: 'POST' })
    setMessages([welcomeForPack(pack)])
    setInput('')
    setActiveTools([])
    onReset()
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
                    <InlineWidget key={i} widget={w} />
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
          data-ui-input=""
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
