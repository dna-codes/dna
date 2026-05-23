/**
 * @dna-codes/dna-api — DNA-derived GraphQL API server.
 *
 * The public surface is intentionally small:
 *   - `createServer({ dna, dataStore })` builds and returns an Apollo
 *     Server + Express app wired around a GraphQL schema generated from
 *     the supplied DNA. Tests pass `integration/memory`; production code
 *     passes `integration/neo4j`.
 *   - `buildSchema({ dna, dataStore })` is exported for harness use when
 *     you want just the schema (e.g. for introspection-only tests).
 *   - `runCli(argv, env)` is the CLI entrypoint — `bin/dna-api.js`
 *     invokes it.
 */

export { createServer } from './server'
export type { CreateServerArgs, CreatedServer } from './server'
export { buildSchema } from './schema'
export type { BuildSchemaArgs } from './schema'
export { runCli } from './cli'
