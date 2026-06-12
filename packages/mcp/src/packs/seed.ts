import type { DnaDataStore } from '@dna-codes/dna-core'
import { PACKS, DEFAULT_PACK } from './index.js'
import type { PackName } from './index.js'

export { DEFAULT_PACK }

export async function seedPack(store: DnaDataStore, packName: PackName = DEFAULT_PACK): Promise<void> {
  const pack = PACKS[packName]
  const [existingRt, existingRel] = await Promise.all([
    store.resourceType.list(),
    store.relationshipType.list(),
  ])
  const existingRtNames = new Set(existingRt.map(r => r.name))
  const existingRelNames = new Set(existingRel.map(r => r.name))

  await Promise.all(
    pack.resourceTypes
      .filter(rt => !existingRtNames.has(rt.name))
      .map(rt => store.resourceType.create(rt)),
  )

  await Promise.all(
    pack.relationshipTypes
      .filter(rt => !existingRelNames.has(rt.name))
      .map(rt => store.relationshipType.create(rt)),
  )
}
