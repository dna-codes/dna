import type {
  DnaDataStore,
  InstanceCreateInput,
  InstanceRecord,
  InstanceRef,
  LinkCreateOptions,
  LinkListFilter,
  LinkRecord,
  ResourceType,
  ResourceTypeInput,
  RelationshipType,
  RelationshipTypeInput,
} from '../types/data-store'
import type { LensDataResult } from '../lens/types'
import { project } from './project'
import { seedProductTypes, applyProjection, PRODUCT_LEVEL_TYPE_NAME } from './apply'

// ── Minimal in-memory DnaDataStore double ───────────────────────────────────
// `@dna-codes/dna-core` cannot depend on `@dna-codes/dna-adapters` (the memory
// adapter lives there and depends on core), so we hand-roll the slice of the
// store the projection persistence touches.
let counter = 0
function refEq(a: InstanceRef, b: InstanceRef) {
  return a.typeName === b.typeName && a.id === b.id
}
function makeStore(): DnaDataStore {
  const resourceTypes = new Map<string, ResourceType>()
  const relationshipTypes = new Map<string, RelationshipType>()
  const instances = new Map<string, Map<string, InstanceRecord>>()
  const links: LinkRecord[] = []
  const bucket = (t: string) => {
    if (!instances.has(t)) instances.set(t, new Map())
    return instances.get(t)!
  }
  const store = {
    resourceType: {
      create: async (input: ResourceTypeInput) => {
        const id = input.id ?? `rt-${++counter}`
        resourceTypes.set(input.name, {
          id,
          name: input.name,
          category: input.category,
          attribute_schema: input.attribute_schema,
          current_version: 1,
          stability: input.stability ?? 'experimental',
          description: input.description,
          is_seed: false,
        })
        return { id }
      },
      list: async () => [...resourceTypes.values()],
    },
    relationshipType: {
      create: async (input: RelationshipTypeInput) => {
        const id = input.id ?? `rrt-${++counter}`
        relationshipTypes.set(input.name, {
          id,
          name: input.name,
          from: input.from,
          to: input.to,
          cardinality: input.cardinality,
          attribute: input.attribute,
          current_version: 1,
          stability: input.stability ?? 'experimental',
          is_seed: false,
        })
        return { id }
      },
      list: async () => [...relationshipTypes.values()],
    },
    instance: {
      create: async (typeName: string, data: InstanceCreateInput) => {
        const id = typeof data.id === 'string' && data.id ? data.id : `i-${++counter}`
        const { id: _drop, ...rest } = data
        void _drop
        bucket(typeName).set(id, { id, ...rest })
        return { id }
      },
      get: async (typeName: string, id: string) => bucket(typeName).get(id) ?? null,
      update: async (typeName: string, id: string, patch: Record<string, unknown>) => {
        const cur = bucket(typeName).get(id)
        if (cur) bucket(typeName).set(id, { ...cur, ...patch, id })
      },
      delete: async (typeName: string, id: string) => {
        bucket(typeName).delete(id)
      },
      list: async (typeName: string) => [...bucket(typeName).values()],
    },
    link: {
      create: async (from: InstanceRef, to: InstanceRef, opts: LinkCreateOptions = {}) => {
        const id = opts.id ?? `l-${++counter}`
        links.push({ id, from, to, ...(opts.role !== undefined ? { role: opts.role } : {}) })
        return { id }
      },
      delete: async (linkId: string) => {
        const idx = links.findIndex((l) => l.id === linkId)
        if (idx >= 0) links.splice(idx, 1)
      },
      list: async (filter: LinkListFilter = {}) =>
        links
          .filter((l) => (filter.from ? refEq(l.from, filter.from) : true))
          .filter((l) => (filter.to ? refEq(l.to, filter.to) : true))
          .filter((l) => (filter.role !== undefined ? l.role === filter.role : true)),
    },
  }
  return store as unknown as DnaDataStore
}

// ── Source graph (mirrors project.test.ts) ───────────────────────────────────
function node(id: string, type: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, _typeName: type, ...extra } as unknown as LensDataResult['nodes'][number]
}
function link(fromId: string, fromType: string, toId: string, toType: string) {
  return {
    id: `l-${fromId}-${toId}`,
    from: { typeName: fromType, id: fromId },
    to: { typeName: toType, id: toId },
    role: 'rel',
  } as unknown as LensDataResult['links'][number]
}
function lendingGraph(): LensDataResult {
  return {
    nodes: [
      node('d1', 'Domain', 'Lending'),
      node('p1', 'Process', 'Origination'),
      node('t1', 'Task', 'Collect'),
      node('op1', 'Operation', 'Loan.Create', { changes: [{ attribute: 'status', set: 'new' }] }),
    ],
    links: [
      link('d1', 'Domain', 'p1', 'Process'),
      link('p1', 'Process', 't1', 'Task'),
      link('t1', 'Task', 'op1', 'Operation'),
    ],
  } as LensDataResult
}

// Persist the business nodes so `realized_as`/`exposes` edges resolve.
async function seedBusinessNodes(store: DnaDataStore, ids: string[]) {
  await store.resourceType.create({ name: 'BusinessNode', category: 'resource', attribute_schema: [] })
  for (const id of ids) await store.instance.create('BusinessNode', { id })
}

// ── 2.3 Type registration ────────────────────────────────────────────────────
describe('seedProductTypes', () => {
  it('registers the product resource types and an App instance can be created', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    const names = (await store.resourceType.list()).map((r) => r.name)
    for (const expected of ['App', 'Module', 'Page', 'Section', 'Component', 'Element', 'Layout']) {
      expect(names).toContain(expected)
    }
    const created = await store.instance.create('App', { name: 'Lending' })
    expect(created.id).toBeDefined()
    const layout = await store.instance.create('Layout', { name: 'AdminLayout' })
    expect(layout.id).toBeDefined()
  })

  it('registers the structural relationship types', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    const names = (await store.relationshipType.list()).map((r) => r.name)
    expect(names).toEqual(expect.arrayContaining(['contains', 'realized_as', 'exposes']))
  })

  it('registers the governance relationship types (can_access, assigned_to)', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    const names = (await store.relationshipType.list()).map((r) => r.name)
    expect(names).toEqual(expect.arrayContaining(['can_access', 'assigned_to']))
  })

  it('is idempotent — re-running creates no duplicates', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedProductTypes(store)
    const rtNames = (await store.resourceType.list()).map((r) => r.name)
    const relNames = (await store.relationshipType.list()).map((r) => r.name)
    expect(new Set(rtNames).size).toBe(rtNames.length)
    expect(new Set(relNames).size).toBe(relNames.length)
    expect(rtNames.filter((n) => n === 'App')).toHaveLength(1)
    expect(relNames.filter((n) => n === 'contains')).toHaveLength(1)
  })
})

// ── 4.1 / 4.2 Persistence + idempotence ───────────────────────────────────────
describe('applyProjection — persistence', () => {
  it('persists nodes plus contains/realized_as edges', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedBusinessNodes(store, ['d1', 'p1', 't1', 'op1'])
    const subgraph = project(lendingGraph())

    const report = await applyProjection(subgraph, store)
    expect(report.instancesCreated).toBe(subgraph.nodes.length)

    const apps = await store.instance.list('App')
    const modules = await store.instance.list('Module')
    expect(apps).toHaveLength(1)
    expect(modules).toHaveLength(1)

    // contains: App → Module
    const appRef: InstanceRef = { typeName: 'App', id: apps[0].id }
    const moduleRef: InstanceRef = { typeName: 'Module', id: modules[0].id }
    expect(await store.link.list({ from: appRef, to: moduleRef, role: 'contains' })).toHaveLength(1)

    // realized_as: App → its business Domain (d1)
    expect(await store.link.list({ from: appRef, role: 'realized_as' })).toHaveLength(1)
    expect((await store.link.list({ from: appRef, role: 'realized_as' }))[0].to).toEqual({
      typeName: 'BusinessNode',
      id: 'd1',
    })
  })

  it('re-applying an unchanged subgraph creates no new instances or links', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedBusinessNodes(store, ['d1', 'p1', 't1', 'op1'])
    const subgraph = project(lendingGraph())

    await applyProjection(subgraph, store)
    const second = await applyProjection(subgraph, store)
    expect(second.instancesCreated).toBe(0)
    expect(second.linksCreated).toBe(0)
  })

  it('adding one business-derived node adds exactly one product instance', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedBusinessNodes(store, ['d1', 'p1', 't1', 'op1', 't2'])
    await applyProjection(project(lendingGraph()), store)

    const g = lendingGraph()
    g.nodes.push(node('t2', 'Task', 'Review') as never)
    g.links.push(link('p1', 'Process', 't2', 'Task') as never)
    const report = await applyProjection(project(g), store)
    expect(report.instancesCreated).toBe(1)
    expect((await store.instance.list('Page')).map((p) => p.realizes)).toContain('t2')
  })
})

// ── 4.3 Governance preservation ───────────────────────────────────────────────
describe('applyProjection — governance', () => {
  it('preserves a can_access link across re-apply', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedBusinessNodes(store, ['d1', 'p1', 't1', 'op1'])
    const subgraph = project(lendingGraph())
    await applyProjection(subgraph, store)

    const app = (await store.instance.list('App'))[0]
    const appRef: InstanceRef = { typeName: 'App', id: app.id }
    const userRef: InstanceRef = { typeName: 'BusinessNode', id: 'u1' }
    await store.instance.create('BusinessNode', { id: 'u1' })
    await store.link.create(userRef, appRef, { role: 'can_access' })

    await applyProjection(subgraph, store)
    expect(await store.link.list({ to: appRef, role: 'can_access' })).toHaveLength(1)
  })

  it('preserves an assigned_to link across re-apply', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedBusinessNodes(store, ['d1', 'p1', 't1', 'op1'])
    const subgraph = project(lendingGraph())
    await applyProjection(subgraph, store)

    const app = (await store.instance.list('App'))[0]
    const appRef: InstanceRef = { typeName: 'App', id: app.id }
    await store.instance.create('BusinessNode', { id: 'u1' })
    // Dana is provisioned into the Lending app.
    await store.link.create({ typeName: 'BusinessNode', id: 'u1' }, appRef, { role: 'assigned_to' })

    await applyProjection(subgraph, store)
    expect(await store.link.list({ to: appRef, role: 'assigned_to' })).toHaveLength(1)
  })
})

// ── 4.4 Soft-delete ───────────────────────────────────────────────────────────
describe('applyProjection — soft-delete', () => {
  it('marks a governed node orphaned when its backing disappears, without removing it', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await seedBusinessNodes(store, ['d1', 'p1', 't1', 'op1'])
    await applyProjection(project(lendingGraph()), store)

    const moduleInst = (await store.instance.list('Module'))[0]
    const moduleRef: InstanceRef = { typeName: 'Module', id: moduleInst.id }
    await store.instance.create('BusinessNode', { id: 'u1' })
    await store.link.create({ typeName: 'BusinessNode', id: 'u1' }, moduleRef, { role: 'can_access' })

    // Re-apply a subgraph whose Domain has lost its Process (module backing gone).
    const stripped: LensDataResult = { nodes: [node('d1', 'Domain', 'Lending')], links: [] } as LensDataResult
    const report = await applyProjection(project(stripped), store)

    expect(report.orphaned).toBe(1)
    const after = await store.instance.get('Module', moduleInst.id)
    expect(after).not.toBeNull()
    expect(after!._orphaned).toBe(true)
  })

  it('PRODUCT_LEVEL_TYPE_NAME maps every projection level used by project()', () => {
    expect(PRODUCT_LEVEL_TYPE_NAME.app).toBe('App')
    expect(PRODUCT_LEVEL_TYPE_NAME.layout).toBe('Layout')
    expect(PRODUCT_LEVEL_TYPE_NAME.namespace).toBe('Namespace')
    expect(PRODUCT_LEVEL_TYPE_NAME.endpoint).toBe('Endpoint')
  })
})

// ── applyPermissions (governance) ────────────────────────────────────────────
import { applyPermissions, PERMISSION_TYPE_NAME } from './apply'
import { projectPermissions } from './permissions'

function lendingPermissionInput() {
  return {
    positions: [{ name: 'Underwriter', scope: 'BankDepartment' }],
    memberships: [{ name: 'EmpUW', person: 'Employee', position: 'Underwriter', group: 'BankDepartment' }],
    rules: [{ rule_type: 'access' as const, allow: [{ role: 'Underwriter' }] }],
  }
}

describe('applyPermissions', () => {
  it('registers the Permission type and grants relationship via seedProductTypes', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    expect((await store.resourceType.list()).map((r) => r.name)).toContain('Permission')
    expect((await store.relationshipType.list()).map((r) => r.name)).toContain('grants')
  })

  it('creates Permission instances and a grants edge from the backing Membership', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await store.resourceType.create({ name: 'Membership', category: 'resource', attribute_schema: [] })
    const mem = await store.instance.create('Membership', { name: 'EmpUW' })

    const report = await applyPermissions(projectPermissions(lendingPermissionInput()), store)
    expect(report.permissionsCreated).toBe(1)
    expect(report.grantsCreated).toBe(1)

    const perms = await store.instance.list(PERMISSION_TYPE_NAME)
    expect(perms).toHaveLength(1)
    expect(perms[0]).toMatchObject({ principal: 'Employee', role: 'Underwriter', scope: 'BankDepartment' })
    const grants = await store.link.list({ role: 'grants' })
    expect(grants).toHaveLength(1)
    expect(grants[0].from.id).toBe(mem.id)
  })

  it('is idempotent: a second apply creates no duplicate Permission or grant', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await store.resourceType.create({ name: 'Membership', category: 'resource', attribute_schema: [] })
    await store.instance.create('Membership', { name: 'EmpUW' })
    const proj = projectPermissions(lendingPermissionInput())
    await applyPermissions(proj, store)
    const second = await applyPermissions(proj, store)
    expect(second.permissionsCreated).toBe(0)
    expect(second.grantsCreated).toBe(0)
    expect(await store.instance.list(PERMISSION_TYPE_NAME)).toHaveLength(1)
  })

  it('reconciles a derived Permission onto a hand-authored one of the same identity (author-fallback)', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    await store.resourceType.create({ name: 'Membership', category: 'resource', attribute_schema: [] })
    await store.instance.create('Membership', { name: 'EmpUW' })
    // Author a Permission first (no backing membership).
    const authored = await store.instance.create(PERMISSION_TYPE_NAME, {
      name: 'authored', principal: 'Employee', role: 'Underwriter', scope: 'BankDepartment',
    })

    const report = await applyPermissions(projectPermissions(lendingPermissionInput()), store)
    expect(report.permissionsCreated).toBe(0) // reconciled, not duplicated
    expect(await store.instance.list(PERMISSION_TYPE_NAME)).toHaveLength(1)
    const grants = await store.link.list({ role: 'grants' })
    expect(grants).toHaveLength(1)
    expect(grants[0].to.id).toBe(authored.id)
  })

  it('emits no grants edge for a planned (under-determined) Permission', async () => {
    const store = makeStore()
    await seedProductTypes(store)
    const proj = projectPermissions({
      positions: [{ name: 'SuperAdmin', scope: ['Workspace', 'Tenant'] }],
      memberships: [{ name: 'EmpAdmin', person: 'Employee', position: 'SuperAdmin' }],
      rules: [{ rule_type: 'access' as const, allow: [{ role: 'SuperAdmin' }] }],
    })
    const report = await applyPermissions(proj, store)
    expect(report.permissionsCreated).toBe(1)
    expect(report.grantsCreated).toBe(0)
    expect((await store.instance.list(PERMISSION_TYPE_NAME))[0]).toMatchObject({ planned: true })
  })
})
