import Anthropic from '@anthropic-ai/sdk'
import { getMcpClient, invalidateMcpClient } from '@/lib/mcp-client'
import { buildSystemPrompt } from '@/lib/system-prompt'
import type { WidgetPayload } from '@dna-codes/dna-mcp'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type AnthropicMessage = Anthropic.MessageParam

function mcpToolToAnthropic(tool: { name: string; description?: string; inputSchema: unknown }): Anthropic.Tool {
  return {
    name: tool.name,
    description: tool.description ?? '',
    input_schema: (tool.inputSchema ?? { type: 'object', properties: {} }) as Anthropic.Tool['input_schema'],
  }
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) => controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'))

      try {
        // Fetch session config to build context-aware system prompt
        const mcpUrl = process.env.DNA_MCP_URL
        let systemPrompt = buildSystemPrompt('operational', false)
        if (mcpUrl) {
          try {
            const cfgRes = await fetch(`${mcpUrl.replace(/\/mcp$/, '')}/session-config`)
            if (cfgRes.ok) {
              const cfg = await cfgRes.json()
              systemPrompt = buildSystemPrompt(cfg.pack ?? 'operational', cfg.locked ?? false)
            }
          } catch { /* fall back to default */ }
        }

        // Reuse persistent connection; reconnect once if the call fails
        let mcpClient = await getMcpClient()
        let mcpTools: Awaited<ReturnType<typeof mcpClient.listTools>>['tools']
        try {
          ;({ tools: mcpTools } = await mcpClient.listTools())
        } catch {
          invalidateMcpClient()
          mcpClient = await getMcpClient()
          ;({ tools: mcpTools } = await mcpClient.listTools())
        }
        const anthropicTools = mcpTools.map(mcpToolToAnthropic)
        // Build conversation history
        const history: AnthropicMessage[] = messages
          .filter(m => m.content.trim())
          .map(m => ({ role: m.role, content: m.content }))

        let didPatch = false

        // Agentic loop: run until no more tool calls
        while (true) {
          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 8192,
            system: systemPrompt,
            messages: history,
            tools: anthropicTools,
            stream: true,
          })

          // Collect the full response while streaming text to the client
          const contentBlocks: Anthropic.MessageParam['content'] = []
          let currentText = ''
          let currentToolUse: { id: string; name: string; inputJson: string } | null = null
          let stopReason: string | null = null

          for await (const event of response) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'text') {
                currentText = ''
              } else if (event.content_block.type === 'tool_use') {
                currentToolUse = { id: event.content_block.id, name: event.content_block.name, inputJson: '' }
                send({ type: 'tool_call', name: event.content_block.name })
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                currentText += event.delta.text
                send({ type: 'text', text: event.delta.text })
              } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
                currentToolUse.inputJson += event.delta.partial_json
              }
            } else if (event.type === 'content_block_stop') {
              if (currentText) {
                contentBlocks.push({ type: 'text', text: currentText })
                currentText = ''
              }
              if (currentToolUse) {
                let input: Record<string, unknown> = {}
                try { input = JSON.parse(currentToolUse.inputJson || '{}') } catch { /* empty input */ }
                contentBlocks.push({ type: 'tool_use', id: currentToolUse.id, name: currentToolUse.name, input })
                currentToolUse = null
              }
            } else if (event.type === 'message_delta') {
              stopReason = event.delta.stop_reason ?? null
            }
          }

          // Add assistant turn to history
          history.push({ role: 'assistant', content: contentBlocks })

          // If no tool calls, we're done
          if (stopReason !== 'tool_use') break

          // Execute all tool calls and collect results
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of contentBlocks) {
            if (block.type !== 'tool_use') continue
            // activate_lens — stream tab switch signal, return ok
            if (block.name === 'activate_lens') {
              send({ type: 'activate_lens', lensId: (block.input as Record<string, string>).lensId })
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify({ ok: true }) })
              continue
            }
            // render_widget is handled client-side — stream the payload and return ok
            if (block.name === 'render_widget') {
              send({ type: 'widget', widget: block.input as WidgetPayload })
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify({ ok: true }) })
              continue
            }
            try {
              const result = await mcpClient.callTool({ name: block.name, arguments: block.input as Record<string, unknown> })
              const content = result.content as Array<{ type: string; text?: string }>
              const text = content
                .filter(c => c.type === 'text')
                .map(c => c.text ?? '')
                .join('\n')
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: text })
              if (block.name === 'patch_graph' && !result.isError) {
                didPatch = true
                send({ type: 'graph_patched' })
              }
            } catch (err) {
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error: ${String(err)}`, is_error: true })
            }
          }

          // Add tool results to history and loop
          history.push({ role: 'user', content: toolResults })
        }

        void didPatch
      } catch (err) {
        send({ type: 'error', error: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
