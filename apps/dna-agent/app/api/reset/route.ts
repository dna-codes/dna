import { NextResponse } from 'next/server'
import { invalidateMcpClient } from '@/lib/mcp-client'

export async function POST(req: Request) {
  const mcpUrl = process.env.DNA_MCP_URL
  if (!mcpUrl) return NextResponse.json({ error: 'DNA_MCP_URL not configured' }, { status: 500 })
  try {
    const base = mcpUrl.replace(/\/mcp$/, '')
    let body: Record<string, unknown> = {}
    try { body = await req.json() } catch { /* no body */ }
    const response = await fetch(`${base}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) return NextResponse.json({ error: 'MCP server error' }, { status: 502 })
    // Drop the persistent MCP client so the next chat request reconnects to the fresh store
    invalidateMcpClient()
    return NextResponse.json(await response.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
