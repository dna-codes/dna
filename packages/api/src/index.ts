/**
 * @dna-codes/dna-api — Registry-native GraphQL API server.
 *
 * Public surface:
 *   - `createServer({ dna, dataStore })` builds the Apollo + Express stack
 *     wired around a schema generated from the data store's current
 *     `ResourceType` / `RelationshipType` records. Tests pass
 *     `integration/memory`; production code passes `integration/neo4j`.
 *   - `buildRegistrySchema({ dataStore, validatorCache, schemaManager })`
 *     for harness use when you want the schema only.
 *   - `SchemaManager` for advanced integration scenarios (e.g. wiring
 *     custom listeners onto schema-change events).
 *   - `runCli(argv, env)` is the CLI entrypoint — `bin/dna-api.js`
 *     invokes it.
 */

export { createServer } from './server'
export type { CreateServerArgs, CreatedServer } from './server'
export { buildRegistrySchema } from './schema'
export type { BuildSchemaArgs } from './schema'
export { SchemaManager } from './schema/schema-manager'
export { ValidatorCache } from './validation/validator-cache'
export { runCli } from './cli'
