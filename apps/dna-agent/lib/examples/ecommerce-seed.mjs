/**
 * Shared example-organization seed: a complete **ecommerce company** graph in
 * three layers (operational, authored Product-UI, business data). Used by both
 * the CLI (`scripts/seed-ecommerce.mjs`) and the in-app loader
 * (`POST /api/examples`), so the example data lives in exactly one place.
 *
 * Talks to a running DNA MCP server over its `/mcp` JSON-RPC endpoint, so it is
 * transport-agnostic across the in-memory and Neo4j stores. Type registration is
 * idempotent; instances are appended, so the caller should reset/clear first for
 * a clean graph (the API route does). Product UI types + structural/governance
 * relationship types are registered by the MCP server on boot.
 */

function sseJson(text) {
  for (const line of text.split('\n')) if (line.startsWith('data: ')) return JSON.parse(line.slice(6))
  return JSON.parse(text)
}

/** A stateless-per-call MCP client (own session) for one seed run. */
function makeClient(baseUrl, log = () => {}) {
  const base = baseUrl.replace(/\/mcp$/, '')
  const MCP = base + '/mcp'
  let SID = null
  let _id = 100

  async function mcp(body) {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }
    if (SID) headers['mcp-session-id'] = SID
    const res = await fetch(MCP, { method: 'POST', headers, body: JSON.stringify(body) })
    const sid = res.headers.get('mcp-session-id')
    if (sid && !SID) SID = sid
    const text = await res.text()
    return text ? sseJson(text) : null
  }
  async function rest(path, body) {
    const res = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  }
  async function init() {
    await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'seed-ecommerce', version: '3' } } })
    await mcp({ jsonrpc: '2.0', method: 'notifications/initialized' })
  }
  async function tool(name, args) {
    const d = await mcp({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args } })
    if (d.error) throw new Error(JSON.stringify(d.error))
    return JSON.parse(d.result.content[0].text)
  }
  async function registry() {
    const g = await tool('get_type_registry', {})
    const rt = g.resourceTypes || g.resource_types || []
    const rel = g.relationshipTypes || g.relationship_types || []
    return { rt: new Set(rt.map((r) => r.name)), rel: new Set(rel.map((r) => r.name)) }
  }
  async function patch(ops, label) {
    if (ops.length === 0) return { applied: 0, ids: {} }
    const res = await tool('patch_graph', { ops })
    if (!('applied' in res)) throw new Error(`${label} failed: ${JSON.stringify(res)}`)
    log(`✓ ${label}: ${res.applied} ops`)
    return res
  }
  return { base, MCP, rest, init, registry, patch }
}

/**
 * Seed the ecommerce example into the MCP server at `baseUrl`. Returns a summary.
 * `opts.log` receives progress lines (used by the CLI; the API route omits it).
 */
export async function applyEcommerceSeed(baseUrl, { log = () => {} } = {}) {
  const c = makeClient(baseUrl, log)
  // Mode is captured when the MCP session is created, so switch to Build BEFORE init.
  await c.rest('/session-config', { mode: 'build' })
  await c.init()

  const { rt, rel } = await c.registry()
  if (!rt.has('App')) throw new Error('Product UI types (App/Module/…) are not registered. Restart the MCP server (it calls seedProductTypes on boot).')

  // 1. Business-data resource types (operational + product types come pre-registered).
  const ensureRt = (name, category, description) => (!rt.has(name) ? [{ op: 'add_resource_type', name, category, description, stability: 'experimental' }] : [])
  await c.patch([
    ...ensureRt('order', 'resource', 'A customer order.'),
    ...ensureRt('product', 'resource', 'A catalog product.'),
    ...ensureRt('customer', 'resource', 'A storefront customer.'),
  ], 'business-data types')

  // Business relationships (distinct from org relationships so they don't pollute org-chart).
  const ensureRel = (name, from_type, to_type, description) => (!rel.has(name) ? [{ op: 'add_relationship_type', name, from_type, to_type, description }] : [])
  await c.patch([
    ...ensureRel('placed_by', 'order', 'customer', 'An order was placed by a customer.'),
    ...ensureRel('contains_item', 'order', 'product', 'An order line item — the product ordered.'),
    ...ensureRel('uses_layout', 'Page', 'Layout', 'A page is wrapped by a layout shell.'),
  ], 'business relationship types')

  // 2. Instances (one batch; capture generated ids by op index).
  const inst = {}
  const ops = []
  const add = (key, type, name, attributes) => { inst[key] = ops.length; ops.push({ op: 'add_instance', type, name, ...(attributes ? { attributes } : {}) }) }

  // — Operational —
  add('SHOP', 'company', 'Shopwave')
  for (const [k, n] of [['MERCH', 'Merchandising'], ['FUL', 'Fulfillment'], ['CS', 'Customer Success'], ['ENG', 'Engineering']]) add(k, 'department', n)
  for (const [k, n, d] of [
    ['VP', 'VP Operations', 'Owns company-wide operational strategy, targets, and cross-department performance.'],
    ['MERCH_MGR', 'Merchandising Manager', 'Leads the product catalog — assortment, listings, and merchandising standards.'],
    ['FUL_MGR', 'Fulfillment Manager', 'Runs order fulfillment end-to-end: receiving, shipping, and delivery.'],
    ['CS_LEAD', 'Support Lead', 'Heads customer support — triage, escalations, and resolution quality.'],
    ['ENG_LEAD', 'Engineering Lead', 'Leads platform engineering: roadmap delivery, releases, and reliability.'],
    ['WARE', 'Warehouse Associate', 'Picks and packs orders accurately and on time in the warehouse.'],
    ['CAT_SPEC', 'Catalog Specialist', 'Drafts and maintains accurate, compelling product listings.'],
    ['AGENT', 'Support Agent', 'Handles customer tickets, resolving issues with empathy and speed.'],
  ]) add(k, 'position', n, { description: d })
  for (const [k, n] of [
    ['PE_VP', 'Maya Okafor'], ['PE_MM', 'Daniel Cho'], ['PE_FM', 'Priya Nair'], ['PE_SL', 'Tom Becker'],
    ['PE_WA', 'Sofia Russo'], ['PE_CS', 'Liam Walsh'], ['PE_AG', 'Hana Kim'], ['PE_EL', 'Ravi Shah'],
  ]) add(k, 'person', n)
  for (const [k, n] of [
    ['PROC_CAT', 'Catalog Management'], ['PROC_FUL', 'Order Fulfillment'], ['PROC_CS', 'Customer Support'],
    ['PROC_ENG', 'Platform Engineering'], ['PROC_OPS', 'Operations Management'],
  ]) add(k, 'process', n)
  for (const [k, n, d] of [
    ['S_DRAFT', 'Draft Product', 'Create a new product listing with copy, imagery, and pricing.'],
    ['S_REVIEW', 'Review Listing', 'Review a drafted listing for accuracy and brand standards.'],
    ['S_PUBLISH', 'Publish Product', 'Approve and publish the listing to the storefront.'],
    ['S_RECV', 'Receive Order', 'Accept and validate an incoming customer order.'],
    ['S_PICK', 'Pick Items', 'Retrieve the ordered items from warehouse shelves.'],
    ['S_PACK', 'Pack Shipment', 'Pack picked items securely and label for shipment.'],
    ['S_SHIP', 'Ship Order', 'Hand the package to the carrier and generate tracking.'],
    ['S_DELIV', 'Confirm Delivery', 'Confirm delivery and close out the order.'],
    ['S_TICKET', 'Receive Ticket', 'Log an incoming customer support request.'],
    ['S_TRIAGE', 'Triage', 'Categorize and prioritize the ticket; escalate if needed.'],
    ['S_RESOLVE', 'Resolve', 'Resolve the customer issue and confirm satisfaction.'],
    ['S_ENG_PLAN', 'Plan Sprint', 'Define and prioritize the engineering sprint backlog.'],
    ['S_ENG_BUILD', 'Build Features', 'Implement, review, and test planned features.'],
    ['S_ENG_DEPLOY', 'Deploy Release', 'Ship the release to production and monitor reliability.'],
    ['S_OPS_TARGET', 'Set Quarterly Targets', 'Set operational goals and KPIs for the quarter.'],
    ['S_OPS_REVIEW', 'Review Performance', 'Review department performance against targets.'],
    ['S_OPS_APPROVE', 'Approve Budget & Hiring', 'Approve budgets, headcount, and major operational plans.'],
  ]) add(k, 'step', n, { description: d })

  // — Product UI (authored) —
  add('L_ADMIN', 'Layout', 'AdminLayout', { type: 'sidebar', description: 'Authenticated admin shell with sidebar navigation.' })
  add('APP', 'App', 'Shopwave Admin')
  add('M_CAT', 'Module', 'Catalog')
  add('M_FUL', 'Module', 'Order Fulfillment')
  add('M_CUST', 'Module', 'Customers')
  add('W_CAT', 'Workflow', 'Manage Catalog')
  add('W_FUL', 'Workflow', 'Fulfill Order')
  add('W_CUST', 'Workflow', 'Manage Customers')
  const page = (k, n) => add(k, 'Page', n, { layout: 'AdminLayout' })
  page('PG_PRODUCTS', 'Products'); page('PG_PRODUCT', 'Product Detail')
  page('PG_ORDERS', 'Orders'); page('PG_ORDER', 'Order Detail'); page('PG_SHIP', 'Shipments')
  page('PG_CUSTOMERS', 'Customers'); page('PG_CUSTOMER', 'Customer Detail')
  for (const [k, n] of [
    ['SEC_O_TOOL', 'Toolbar'], ['SEC_O_LIST', 'Order List'],
    ['SEC_OD_SUM', 'Summary'], ['SEC_OD_ACT', 'Actions'],
    ['SEC_P_TOOL', 'Toolbar'], ['SEC_P_CAT', 'Catalog'],
    ['SEC_C_LIST', 'Customer List'],
  ]) add(k, 'Section', n)
  const comp = (k, n, type, resource) => add(k, 'Component', n, { type, ...(resource ? { resource } : {}) })
  comp('C_NEWORDER', 'New Order', 'button'); comp('C_OFILTER', 'Status Filter', 'select'); comp('C_OSEARCH', 'Search Orders', 'search')
  comp('C_OTABLE', 'Orders', 'table', 'order')
  comp('C_OCARD', 'Order Summary', 'card'); comp('C_SHIP', 'Mark Shipped', 'button'); comp('C_REFUND', 'Refund', 'button')
  comp('C_NEWPROD', 'New Product', 'button'); comp('C_PSEARCH', 'Search Products', 'search')
  comp('C_PTABLE', 'Products', 'table', 'product')
  comp('C_CTABLE', 'Customers', 'table', 'customer')

  // — Business data —
  const orders = [
    ['SW-1001', 'Ava Thompson', 129.99, 'paid', '2026-06-10'], ['SW-1002', 'Liam Patel', 54.5, 'fulfilled', '2026-06-10'],
    ['SW-1003', 'Noah Kim', 312.0, 'pending', '2026-06-11'], ['SW-1004', 'Emma Garcia', 89.95, 'paid', '2026-06-11'],
    ['SW-1005', 'Olivia Chen', 21.0, 'refunded', '2026-06-12'], ['SW-1006', 'Mason Rivera', 475.25, 'fulfilled', '2026-06-12'],
    ['SW-1007', 'Sophia Nguyen', 64.0, 'pending', '2026-06-13'],
  ]
  orders.forEach(([order_number, customer, total, status, placed_at], i) => add(`order${i}`, 'order', order_number, { order_number, customer, total, status, placed_at }))
  const products = [['Aurora Desk Lamp', 'LAMP-01', 39.99, 120], ['Nimbus Wireless Earbuds', 'AUDIO-22', 89.0, 64], ['Trailhead Daypack', 'BAG-07', 74.5, 33], ['Coastal Ceramic Mug', 'MUG-03', 18.0, 210], ['Lumen Smart Bulb', 'BULB-09', 24.0, 88]]
  products.forEach(([name, sku, price, stock], i) => add(`prod${i}`, 'product', name, { sku, price, stock }))
  const customers = [
    ['Ava Thompson', 'ava@example.com', 'gold'], ['Liam Patel', 'liam@example.com', 'silver'],
    ['Noah Kim', 'noah@example.com', 'bronze'], ['Emma Garcia', 'emma@example.com', 'gold'],
    ['Olivia Chen', 'olivia@example.com', 'silver'], ['Mason Rivera', 'mason@example.com', 'bronze'],
    ['Sophia Nguyen', 'sophia@example.com', 'gold'],
  ]
  customers.forEach(([name, email, tier], i) => add(`cust${i}`, 'customer', name, { email, tier }))

  const res = await c.patch(ops, 'instances')
  const id = (k) => res.ids[String(inst[k])]

  // 3. Links.
  const link = (type, from, to) => ({ op: 'add_link', type, from: id(from), to: id(to) })
  const links = []
  for (const d of ['MERCH', 'FUL', 'CS', 'ENG']) links.push(link('belongs_to', d, 'SHOP'))
  links.push(link('belongs_to', 'VP', 'SHOP'))
  for (const [p, d] of [['MERCH_MGR', 'MERCH'], ['FUL_MGR', 'FUL'], ['CS_LEAD', 'CS'], ['ENG_LEAD', 'ENG'], ['WARE', 'FUL'], ['CAT_SPEC', 'MERCH'], ['AGENT', 'CS']]) links.push(link('belongs_to', p, d))
  // Reporting nests within a department in the org-chart lens, so managers are dept heads.
  for (const [p, m] of [['WARE', 'FUL_MGR'], ['CAT_SPEC', 'MERCH_MGR'], ['AGENT', 'CS_LEAD']]) links.push(link('reports_to', p, m))
  for (const [pe, p] of [['PE_VP', 'VP'], ['PE_MM', 'MERCH_MGR'], ['PE_FM', 'FUL_MGR'], ['PE_SL', 'CS_LEAD'], ['PE_WA', 'WARE'], ['PE_CS', 'CAT_SPEC'], ['PE_AG', 'AGENT'], ['PE_EL', 'ENG_LEAD']]) links.push(link('fills', pe, p))
  const chain = (proc, steps, owners) => {
    steps.forEach((s, i) => { links.push(link('belongs_to', s, proc)); links.push(link('assigned_to', s, owners[i])); if (i > 0) links.push(link('next_step', steps[i - 1], s)) })
  }
  chain('PROC_CAT', ['S_DRAFT', 'S_REVIEW', 'S_PUBLISH'], ['CAT_SPEC', 'MERCH_MGR', 'MERCH_MGR'])
  chain('PROC_FUL', ['S_RECV', 'S_PICK', 'S_PACK', 'S_SHIP', 'S_DELIV'], ['FUL_MGR', 'WARE', 'WARE', 'FUL_MGR', 'FUL_MGR'])
  chain('PROC_CS', ['S_TICKET', 'S_TRIAGE', 'S_RESOLVE'], ['AGENT', 'CS_LEAD', 'AGENT'])
  chain('PROC_ENG', ['S_ENG_PLAN', 'S_ENG_BUILD', 'S_ENG_DEPLOY'], ['ENG_LEAD', 'ENG_LEAD', 'ENG_LEAD'])
  chain('PROC_OPS', ['S_OPS_TARGET', 'S_OPS_REVIEW', 'S_OPS_APPROVE'], ['VP', 'VP', 'VP'])
  const contains = (parent, children) => children.forEach((ch) => links.push(link('contains', parent, ch)))
  contains('APP', ['M_CAT', 'M_FUL', 'M_CUST'])
  contains('M_CAT', ['W_CAT']); contains('M_FUL', ['W_FUL']); contains('M_CUST', ['W_CUST'])
  contains('W_CAT', ['PG_PRODUCTS', 'PG_PRODUCT']); contains('W_FUL', ['PG_ORDERS', 'PG_ORDER', 'PG_SHIP']); contains('W_CUST', ['PG_CUSTOMERS', 'PG_CUSTOMER'])
  contains('PG_ORDERS', ['SEC_O_TOOL', 'SEC_O_LIST']); contains('PG_ORDER', ['SEC_OD_SUM', 'SEC_OD_ACT'])
  contains('PG_PRODUCTS', ['SEC_P_TOOL', 'SEC_P_CAT']); contains('PG_CUSTOMERS', ['SEC_C_LIST'])
  contains('SEC_O_TOOL', ['C_NEWORDER', 'C_OFILTER', 'C_OSEARCH']); contains('SEC_O_LIST', ['C_OTABLE'])
  contains('SEC_OD_SUM', ['C_OCARD']); contains('SEC_OD_ACT', ['C_SHIP', 'C_REFUND'])
  contains('SEC_P_TOOL', ['C_NEWPROD', 'C_PSEARCH']); contains('SEC_P_CAT', ['C_PTABLE'])
  contains('SEC_C_LIST', ['C_CTABLE'])
  for (const [m, p] of [['M_CAT', 'PROC_CAT'], ['M_FUL', 'PROC_FUL'], ['M_CUST', 'PROC_CS']]) links.push(link('realized_as', m, p))
  links.push(link('realized_as', 'PG_ORDERS', 'S_RECV')); links.push(link('realized_as', 'PG_PRODUCTS', 'S_DRAFT'))
  for (const [pos, surf] of [
    ['VP', 'M_CAT'], ['VP', 'M_FUL'], ['VP', 'M_CUST'],
    ['CAT_SPEC', 'M_CAT'], ['FUL_MGR', 'M_FUL'], ['AGENT', 'M_CUST'],
  ]) links.push(link('can_access', pos, surf))
  orders.forEach((_, i) => {
    links.push(link('placed_by', `order${i}`, `cust${i}`))
    links.push(link('contains_item', `order${i}`, `prod${i % products.length}`))
  })
  for (const pg of ['PG_PRODUCTS', 'PG_PRODUCT', 'PG_ORDERS', 'PG_ORDER', 'PG_SHIP', 'PG_CUSTOMERS', 'PG_CUSTOMER']) links.push(link('uses_layout', pg, 'L_ADMIN'))

  await c.patch(links, 'links')
  await c.rest('/session-config', { mode: 'operate' })

  const vm = await c.rest('/lens/product-app-preview')
  return { roots: vm.roots.length, surfaceRecords: vm.surfaceRecords.length, grants: vm.access.grants.length }
}

/** Registry of selectable example organizations (the UI lists these). */
export const EXAMPLES = [
  {
    id: 'ecommerce',
    label: 'Shopwave',
    domain: 'E-commerce',
    description: 'An online retailer — product catalog, order fulfillment, and customer support. Full org chart, processes & job descriptions, an authored admin App, and live orders/products/customers.',
    apply: applyEcommerceSeed,
  },
]
