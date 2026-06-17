import { NextResponse } from 'next/server'
import { EXAMPLES } from '@/lib/examples/ecommerce-seed.mjs'

/** List the selectable example organizations (without the apply fn). */
export async function GET() {
  return NextResponse.json({
    examples: EXAMPLES.map(({ id, label, domain, description }) => ({ id, label, domain, description })),
  })
}

/** Load an example organization: reset the store, then seed the example graph. */
export async function POST(req: Request) {
  const mcpUrl = process.env.DNA_MCP_URL
  if (!mcpUrl) return NextResponse.json({ error: 'DNA_MCP_URL not configured' }, { status: 500 })
  const base = mcpUrl.replace(/\/mcp$/, '')

  let id: string
  try {
    ;({ id } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Expected JSON body { id }' }, { status: 400 })
  }
  const example = EXAMPLES.find((e) => e.id === id)
  if (!example) return NextResponse.json({ error: `Unknown example "${id}"` }, { status: 400 })

  try {
    // Clean slate (clears the store + reseeds pack/product types), then load the example.
    const reset = await fetch(`${base}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!reset.ok) return NextResponse.json({ error: 'MCP reset failed' }, { status: 502 })

    const summary = await example.apply(base)
    return NextResponse.json({ ok: true, id, summary })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
