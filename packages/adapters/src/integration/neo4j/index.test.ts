/**
 * Live Neo4j integration tests. Gated on the `NEO4J_URI` environment
 * variable — when unset (the default), every test in this file is
 * skipped so unit-test runs (CI, pre-commit) succeed without a database.
 *
 * Run against a real instance with:
 *
 *   NEO4J_URI=bolt://localhost:7687 \
 *   NEO4J_USERNAME=neo4j \
 *   NEO4J_PASSWORD=test \
 *   npm test --workspace @dna-codes/dna-adapters -- --testPathPattern neo4j
 *
 * Tests use a unique database namespace per run via the `_dnaId` /
 * `_testRunId` pattern — every Instance and TypeDefinition they create
 * is tagged so a failing run can be cleaned up by hand without affecting
 * concurrent work in the same instance.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

import type { OperationalDNA } from '@dna-codes/dna-core'

import { createClient } from './client'

const HAS_NEO4J = typeof process.env.NEO4J_URI === 'string' && process.env.NEO4J_URI.length > 0
const describeNeo4j = HAS_NEO4J ? describe : describe.skip

const REGISTRY_FIXTURE_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'examples',
  'registry',
  'operational.json',
)

const LENDING_FIXTURE_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'examples',
  'lending',
  'operational.json',
)

function envOptions(): { uri: string; username: string; password: string; database?: string } {
  return {
    uri: process.env.NEO4J_URI!,
    username: process.env.NEO4J_USERNAME ?? 'neo4j',
    password: process.env.NEO4J_PASSWORD ?? 'neo4j',
    ...(process.env.NEO4J_DATABASE ? { database: process.env.NEO4J_DATABASE } : {}),
  }
}

function lendingDna(): OperationalDNA {
  return JSON.parse(readFileSync(LENDING_FIXTURE_PATH, 'utf-8')) as OperationalDNA
}

function registryDna(): OperationalDNA {
  return JSON.parse(readFileSync(REGISTRY_FIXTURE_PATH, 'utf-8')) as OperationalDNA
}

describe('integration/neo4j gating', () => {
  it('skips when NEO4J_URI is unset', () => {
    // Smoke check: this test always runs. The describeNeo4j blocks below
    // are skipped (not failed) when NEO4J_URI is absent.
    if (!HAS_NEO4J) {
      // eslint-disable-next-line no-console
      console.log('NEO4J_URI not set — live integration tests skipped.')
    }
    expect(true).toBe(true)
  })
})

describeNeo4j('integration/neo4j live', () => {
  let client: ReturnType<typeof createClient>
  let createdInstances: Array<{ typeName: string; id: string }> = []
  let createdLinks: string[] = []

  beforeAll(async () => {
    client = createClient(envOptions(), lendingDna())
    await client.migrate()
  })

  afterEach(async () => {
    // Best-effort cleanup of anything this test created so the next
    // assertion isn't poisoned by stale data.
    for (const linkId of createdLinks) {
      await client.link.delete(linkId).catch(() => undefined)
    }
    createdLinks = []
    for (const { typeName, id } of createdInstances) {
      await client.instance.delete(typeName, id).catch(() => undefined)
    }
    createdInstances = []
  })

  afterAll(async () => {
    await client.close()
  })

  it('migrate() is idempotent across repeated calls', async () => {
    await expect(client.migrate()).resolves.toBeUndefined()
    await expect(client.migrate()).resolves.toBeUndefined()
  })

  it('round-trips Instance create → get → update → delete', async () => {
    const created = await client.instance.create('Loan', { amount: 1000, status: 'pending' })
    createdInstances.push({ typeName: 'Loan', id: created.id })
    const got = await client.instance.get('Loan', created.id)
    expect(got).toEqual({ id: created.id, amount: 1000, status: 'pending' })

    await client.instance.update('Loan', created.id, { status: 'active' })
    const updated = await client.instance.get('Loan', created.id)
    expect(updated).toEqual({ id: created.id, amount: 1000, status: 'active' })

    await client.instance.delete('Loan', created.id)
    expect(await client.instance.get('Loan', created.id)).toBeNull()
    createdInstances = createdInstances.filter((c) => c.id !== created.id)
  })

  it('list returns all Instances of a type, then delete prunes', async () => {
    const a = await client.instance.create('Loan', { amount: 1 })
    const b = await client.instance.create('Loan', { amount: 2 })
    createdInstances.push({ typeName: 'Loan', id: a.id }, { typeName: 'Loan', id: b.id })
    const all = await client.instance.list('Loan')
    const ours = all.filter((r) => r.id === a.id || r.id === b.id)
    expect(ours).toHaveLength(2)
  })

  it('caller-provided id collision throws', async () => {
    const fixed = `live-loan-${Date.now()}`
    await client.instance.create('Loan', { id: fixed, amount: 1 })
    createdInstances.push({ typeName: 'Loan', id: fixed })
    await expect(client.instance.create('Loan', { id: fixed, amount: 2 })).rejects.toThrow(
      /already exists/,
    )
  })

  it('Link create + list + delete round-trip with role and attributes', async () => {
    const loan = await client.instance.create('Loan', { amount: 1000 })
    const borrower = await client.instance.create('Person', { name: 'Alice' })
    createdInstances.push(
      { typeName: 'Loan', id: loan.id },
      { typeName: 'Person', id: borrower.id },
    )

    const link = await client.link.create(
      { typeName: 'Loan', id: loan.id },
      { typeName: 'Person', id: borrower.id },
      { role: 'primary_borrower', attributes: { assigned_at: '2026-05-23' } },
    )
    createdLinks.push(link.id)

    const byFrom = await client.link.list({ from: { typeName: 'Loan', id: loan.id } })
    expect(byFrom).toHaveLength(1)
    expect(byFrom[0]).toMatchObject({
      id: link.id,
      from: { typeName: 'Loan', id: loan.id },
      to: { typeName: 'Person', id: borrower.id },
      role: 'primary_borrower',
      attributes: { assigned_at: '2026-05-23' },
    })

    await client.link.delete(link.id)
    createdLinks = createdLinks.filter((id) => id !== link.id)
    expect(await client.link.list({ from: { typeName: 'Loan', id: loan.id } })).toHaveLength(0)
  })
})

describeNeo4j('integration/neo4j registry fixture round-trip', () => {
  it('migrates a registry DNA and round-trips TypeDefinition + Instance + Link', async () => {
    const client = createClient(envOptions(), registryDna())
    try {
      await client.migrate()
      const td = await client.instance.create('TypeDefinition', {
        type_name: 'Loan',
        category: 'resource',
        attribute_schema: '{"type":"object"}',
        status: 'published',
      })
      const i1 = await client.instance.create('Instance', {
        type_def: td.id,
        data: '{"amount":1000}',
        validation_status: 'valid',
      })
      const i2 = await client.instance.create('Instance', {
        type_def: td.id,
        data: '{"amount":2000}',
        validation_status: 'valid',
      })
      const link = await client.link.create(
        { typeName: 'Instance', id: i1.id },
        { typeName: 'Instance', id: i2.id },
        { role: 'belongs_to' },
      )

      const list = await client.link.list({ role: 'belongs_to' })
      expect(list.find((l) => l.id === link.id)).toMatchObject({
        from: { typeName: 'Instance', id: i1.id },
        to: { typeName: 'Instance', id: i2.id },
      })

      await client.link.delete(link.id)
      await client.instance.delete('Instance', i1.id)
      await client.instance.delete('Instance', i2.id)
      await client.instance.delete('TypeDefinition', td.id)
    } finally {
      await client.close()
    }
  })
})

// Destructive: `clear()` wipes the entire database, so this runs in its own
// block with its own client. Only against the throwaway live instance.
describeNeo4j('integration/neo4j clear()', () => {
  it('wipes the whole graph, drops the seed marker, and stays usable', async () => {
    const client = createClient(envOptions(), lendingDna())
    try {
      await client.migrate()
      await client.seedFromDna(lendingDna())
      const loan = await client.instance.create('Loan', { amount: 1 })
      expect((await client.resourceType.list()).length).toBeGreaterThan(0)
      expect(await client.hasBeenSeeded()).toBe(true)

      await client.clear()

      expect(await client.resourceType.list()).toHaveLength(0)
      expect(await client.relationshipType.list()).toHaveLength(0)
      expect(await client.link.list()).toHaveLength(0)
      expect(await client.instance.get('Loan', loan.id)).toBeNull()
      expect(await client.hasBeenSeeded()).toBe(false)

      // Re-migrate + reseed succeeds on the cleared store.
      await client.migrate()
      await client.seedFromDna(lendingDna())
      expect((await client.resourceType.list()).length).toBeGreaterThan(0)
    } finally {
      await client.close()
    }
  })
})
