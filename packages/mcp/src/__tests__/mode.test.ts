/**
 * Tests for Build/Operate mode gating in patch validation.
 *
 * Locking is derived from session mode: Build is open (type-schema ops allowed),
 * Operate is locked (type-schema ops rejected). Instance ops are allowed in both.
 */

import { createClient } from '@dna-codes/dna-adapters/integration/memory'
import type { DnaDataStore } from '@dna-codes/dna-core'
import { validatePatchOps } from '../server.js'
import type { PatchOp } from '../types.js'

async function seedStore(store: DnaDataStore) {
  await store.migrate()
  await store.resourceType.create({ name: 'company', category: 'group', attribute_schema: [], stability: 'stable' })
  await store.resourceType.create({ name: 'position', category: 'position', attribute_schema: [], stability: 'stable' })
}

const addResourceType: PatchOp = { op: 'add_resource_type', name: 'Squad', category: 'group' }
const addRelationshipType: PatchOp = { op: 'add_relationship_type', name: 'pairs_with', from_type: 'position', to_type: 'position' }
const addInstance: PatchOp = { op: 'add_instance', type: 'position', name: 'CEO' }

describe('mode gating in validatePatchOps', () => {
  it('Build mode allows add_resource_type and add_relationship_type', async () => {
    const store = createClient()
    await seedStore(store)
    const violations = await validatePatchOps([addResourceType, addRelationshipType], store, 'build')
    expect(violations).toEqual([])
  })

  it('Operate mode rejects add_resource_type with the lock message', async () => {
    const store = createClient()
    await seedStore(store)
    const violations = await validatePatchOps([addResourceType], store, 'operate')
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('locked in Operate mode')
    expect(violations[0]).toContain('switch to Build mode')
  })

  it('Operate mode rejects add_relationship_type', async () => {
    const store = createClient()
    await seedStore(store)
    const violations = await validatePatchOps([addRelationshipType], store, 'operate')
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('locked in Operate mode')
  })

  it('Operate mode allows add_instance', async () => {
    const store = createClient()
    await seedStore(store)
    const violations = await validatePatchOps([addInstance], store, 'operate')
    expect(violations).toEqual([])
  })

  it('Build mode allows add_instance', async () => {
    const store = createClient()
    await seedStore(store)
    const violations = await validatePatchOps([addInstance], store, 'build')
    expect(violations).toEqual([])
  })

  it('defaults to Build (open) when mode is omitted', async () => {
    const store = createClient()
    await seedStore(store)
    const violations = await validatePatchOps([addResourceType], store)
    expect(violations).toEqual([])
  })
})
