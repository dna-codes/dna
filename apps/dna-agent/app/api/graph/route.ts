import { NextResponse } from 'next/server'

export async function GET() {
  const mcpUrl = process.env.DNA_MCP_URL
  if (!mcpUrl) return NextResponse.json({ error: 'DNA_MCP_URL not configured' }, { status: 500 })
  try {
    const base = mcpUrl.replace(/\/mcp$/, '')
    const response = await fetch(`${base}/graph`)
    if (!response.ok) return NextResponse.json({ error: 'MCP server error' }, { status: 502 })
    return NextResponse.json(await response.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
