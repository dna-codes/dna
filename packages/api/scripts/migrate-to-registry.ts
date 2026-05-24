#!/usr/bin/env node
/**
 * One-shot migration from `@dna-codes/dna-api@0.1.0` storage labels
 * (`:TypeDefinition`, `:RelationshipDef`) to the registry-native shape
 * introduced in 0.2.0 (`:ResourceType`, `:RelationshipType` + version
 * history nodes + `:SeedMarker`).
 *
 * Idempotent: re-running after success is a no-op. Designed to be run
 * once per Neo4j instance before deploying the new API version.
 *
 * Usage (from the repo root):
 *
 *   NEO4J_URI=bolt://localhost:7687 \
 *   NEO4J_USERNAME=neo4j \
 *   NEO4J_PASSWORD=devpassword \
 *   node packages/api/scripts/migrate-to-registry.js
 *
 * (Or `npx ts-node packages/api/scripts/migrate-to-registry.ts` when run
 * directly from source.)
 *
 * What this script does, in order:
 *   1. Rename every `:TypeDefinition` node to `:ResourceType` and stamp
 *      `current_version: 1`, `is_seed: false`.
 *   2. Same for `:RelationshipDef` → `:RelationshipType`.
 *   3. For each renamed type, write a `:ResourceTypeVersion` (or
 *      `:RelationshipTypeVersion`) record with `version: 1` carrying the
 *      existing `attribute_schema`, linked via `[:VERSION_OF]`.
 *   4. Stamp `_schemaVersion: 1` on every Instance node (across every
 *      per-typename label) and every `:LINK` edge that lacks one.
 *   5. Write a singleton `:SeedMarker` node so subsequent API boots
 *      skip the seed step.
 */

import { randomUUID } from 'crypto'

import neo4j from 'neo4j-driver'

function loadEnv(): { uri: string; username: string; password: string; database?: string } {
  const { NEO4J_URI: uri, NEO4J_USERNAME: username, NEO4J_PASSWORD: password, NEO4J_DATABASE: database } = process.env
  if (!uri || !username || !password) {
    throw new Error('Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in the environment.')
  }
  return { uri, username, password, ...(database ? { database } : {}) }
}

async function main(): Promise<number> {
  const opts = loadEnv()
  const driver = neo4j.driver(opts.uri, neo4j.auth.basic(opts.username, opts.password), {
    disableLosslessIntegers: true,
  })
  const session = opts.database ? driver.session({ database: opts.database }) : driver.session()

  try {
    // 1. Rename TypeDefinition → ResourceType (with version stamp).
    const renameResourceType = await session.run(`
      MATCH (n:TypeDefinition)
      WHERE NOT n:ResourceType
      SET n:ResourceType, n.current_version = coalesce(n.current_version, 1), n.is_seed = coalesce(n.is_seed, false)
      REMOVE n:TypeDefinition
      RETURN count(n) AS renamed
    `)
    const renamedResourceTypes = Number(renameResourceType.records[0]?.get('renamed') ?? 0)
    console.log(`Renamed ${renamedResourceTypes} :TypeDefinition node(s) → :ResourceType`)

    // 2. Rename RelationshipDef → RelationshipType.
    const renameRelationshipType = await session.run(`
      MATCH (n:RelationshipDef)
      WHERE NOT n:RelationshipType
      SET n:RelationshipType, n.current_version = coalesce(n.current_version, 1), n.is_seed = coalesce(n.is_seed, false)
      REMOVE n:RelationshipDef
      RETURN count(n) AS renamed
    `)
    const renamedRelationshipTypes = Number(renameRelationshipType.records[0]?.get('renamed') ?? 0)
    console.log(
      `Renamed ${renamedRelationshipTypes} :RelationshipDef node(s) → :RelationshipType`,
    )

    // 3a. Write initial :ResourceTypeVersion records.
    const rtForVersions = await session.run(`
      MATCH (rt:ResourceType)
      WHERE NOT EXISTS { MATCH (:ResourceTypeVersion)-[:VERSION_OF]->(rt) }
      RETURN rt.id AS id, rt.attribute_schema AS schema
    `)
    for (const record of rtForVersions.records) {
      const id = record.get('id') as string
      const schema = record.get('schema') ?? '[]'
      await session.run(
        `
        MATCH (rt:ResourceType {id: $id})
        CREATE (v:ResourceTypeVersion {id: $vid, resource_type_id: $id, version: 1, attribute_schema: $schema, created_at: $now})
        CREATE (v)-[:VERSION_OF]->(rt)
      `,
        {
          id,
          vid: randomUUID(),
          schema: typeof schema === 'string' ? schema : JSON.stringify(schema),
          now: new Date().toISOString(),
        },
      )
    }
    console.log(`Wrote ${rtForVersions.records.length} :ResourceTypeVersion record(s)`)

    // 3b. Write initial :RelationshipTypeVersion records.
    const rrtForVersions = await session.run(`
      MATCH (rt:RelationshipType)
      WHERE NOT EXISTS { MATCH (:RelationshipTypeVersion)-[:VERSION_OF]->(rt) }
      RETURN rt.id AS id, rt.attribute_schema AS schema
    `)
    for (const record of rrtForVersions.records) {
      const id = record.get('id') as string
      const schema = record.get('schema') ?? '[]'
      await session.run(
        `
        MATCH (rt:RelationshipType {id: $id})
        CREATE (v:RelationshipTypeVersion {id: $vid, relationship_type_id: $id, version: 1, attribute_schema: $schema, created_at: $now})
        CREATE (v)-[:VERSION_OF]->(rt)
      `,
        {
          id,
          vid: randomUUID(),
          schema: typeof schema === 'string' ? schema : JSON.stringify(schema),
          now: new Date().toISOString(),
        },
      )
    }
    console.log(`Wrote ${rrtForVersions.records.length} :RelationshipTypeVersion record(s)`)

    // 4. Stamp _schemaVersion on Instance nodes + LINK edges that lack one.
    // Instance nodes: scan every label that isn't metadata.
    const labelsResult = await session.run(`
      CALL db.labels() YIELD label
      WHERE NOT label IN ['ResourceType', 'RelationshipType', 'ResourceTypeVersion', 'RelationshipTypeVersion', 'SeedMarker', 'TypeDefinition', 'RelationshipDef']
      RETURN collect(label) AS labels
    `)
    const instanceLabels = (labelsResult.records[0]?.get('labels') ?? []) as string[]
    let stampedInstances = 0
    for (const label of instanceLabels) {
      const safeLabel = label.replace(/[^A-Za-z0-9]/g, '')
      if (safeLabel !== label) continue
      const stamp = await session.run(`
        MATCH (n:\`${label}\`)
        WHERE n._schemaVersion IS NULL AND n._id IS NOT NULL
        SET n._schemaVersion = 1
        RETURN count(n) AS stamped
      `)
      stampedInstances += Number(stamp.records[0]?.get('stamped') ?? 0)
    }
    console.log(`Stamped ${stampedInstances} Instance node(s) with _schemaVersion: 1`)

    // LINK edges.
    const stampLinks = await session.run(`
      MATCH ()-[r:LINK]->()
      WHERE r._schemaVersion IS NULL
      SET r._schemaVersion = 1
      RETURN count(r) AS stamped
    `)
    const stampedLinks = Number(stampLinks.records[0]?.get('stamped') ?? 0)
    console.log(`Stamped ${stampedLinks} :LINK edge(s) with _schemaVersion: 1`)

    // 5. Write the :SeedMarker sentinel.
    await session.run(
      `
      MERGE (m:SeedMarker)
      ON CREATE SET m.createdAt = $now, m.dnaHash = 'migrated-from-v0.1.0'
    `,
      { now: new Date().toISOString() },
    )
    console.log('Wrote :SeedMarker (subsequent API boots will skip the seed step)')

    return 0
  } finally {
    await session.close()
    await driver.close()
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err && err.stack ? err.stack : err)
    process.exit(1)
  })
