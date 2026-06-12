import { NextResponse } from 'next/server'

function base() {
  const mcpUrl = process.env.DNA_MCP_URL
  if (!mcpUrl) return null
  return mcpUrl.replace(/\/mcp$/, '')
}

export async function GET() {
  const b = base()
  if (!b) return NextResponse.json({ error: 'DNA_MCP_URL not configured' }, { status: 500 })
  try {
    const response = await fetch(`${b}/session-config`)
    if (!response.ok) return NextResponse.json({ error: 'MCP server error' }, { status: 502 })
    return NextResponse.json(await response.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const b = base()
  if (!b) return NextResponse.json({ error: 'DNA_MCP_URL not configured' }, { status: 500 })
  try {
    const body = await req.json()
    const response = await fetch(`${b}/session-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) return NextResponse.json({ error: 'MCP server error' }, { status: 502 })
    return NextResponse.json(await response.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
