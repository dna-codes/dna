/**
 * Apollo Server v5 + Express HTTP integration for the registry-native API.
 *
 * `createServer({ dna, dataStore })`:
 *   1. Calls `dataStore.migrate()` (constraints/indexes only).
 *   2. Checks `dataStore.hasBeenSeeded()`. If false, calls
 *      `dataStore.seedFromDna(dna)` to populate the foundational
 *      `ResourceType` / `RelationshipType` records.
 *   3. Instantiates a `SchemaManager` whose builder reads from the store
 *      and calls `rebuild()` to populate the initial schema.
 *   4. Subscribes to schema-change events to recreate the Apollo Server
 *      instance on swap (D5 — restart pattern).
 *   5. Returns the composed server + Express app + `listen(port)` helper.
 */

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4'
import bodyParser from 'body-parser'
import cors from 'cors'
import express, { type Express, type RequestHandler } from 'express'
import http from 'http'

import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core'

import { buildRegistrySchema } from './schema'
import { SchemaManager } from './schema/schema-manager'
import { ValidatorCache } from './validation/validator-cache'

export interface CreateServerArgs {
  /** DNA used ONLY for first-boot seeding via `dataStore.seedFromDna`. Ignored on subsequent boots. */
  dna: OperationalDNA
  dataStore: DnaDataStore
}

export interface CreatedServer {
  schemaManager: SchemaManager
  apolloServer: ApolloServer
  expressApp: Express
  listen(port: number): Promise<{ close(): Promise<void> }>
}

export async function createServer(args: CreateServerArgs): Promise<CreatedServer> {
  const { dna, dataStore } = args

  // 1. Migrate constraints/indexes. No data writes.
  await dataStore.migrate()

  // 2. First-boot seeding if needed.
  const alreadySeeded = await dataStore.hasBeenSeeded()
  if (!alreadySeeded) {
    await dataStore.seedFromDna(dna)
  }

  // 3. SchemaManager owns the live schema. Builder closure reads from
  //    the data store + threads the validator cache and a self-reference
  //    so admin mutations can trigger rebuilds.
  const validatorCache = new ValidatorCache()
  // Lazy ref so SchemaManager can pass itself to the builder.
  let manager!: SchemaManager
  manager = new SchemaManager(() =>
    buildRegistrySchema({ dataStore, validatorCache, schemaManager: manager }),
  )
  await manager.rebuild()

  // 4. Apollo Server v5 + Express. The Apollo instance is re-created on
  //    schema swaps (D5 restart pattern); the Express app and HTTP server
  //    stay up between swaps. We expose the *current* Apollo instance to
  //    Express through a single middleware wrapper that forwards to
  //    whichever Apollo instance is live.
  let apolloServer = new ApolloServer({ schema: manager.getSchema() })
  await apolloServer.start()

  let graphqlMiddleware: RequestHandler = expressMiddleware(apolloServer)

  manager.onChange(async (newSchema) => {
    const newApollo = new ApolloServer({ schema: newSchema })
    await newApollo.start()
    const oldApollo = apolloServer
    apolloServer = newApollo
    graphqlMiddleware = expressMiddleware(newApollo)
    // Stop the old instance after the swap so in-flight requests already
    // bound to it complete.
    setImmediate(() => {
      void oldApollo.stop()
    })
  })

  const expressApp = express()
  expressApp.use(cors())
  expressApp.use(bodyParser.json())
  expressApp.get('/healthz', (_req, res) => {
    res.status(200).send('ok')
  })
  // Forwarder middleware — looks up the current GraphQL middleware on
  // every request so schema swaps land without re-mounting Express routes.
  expressApp.use('/graphql', (req, res, next) => {
    graphqlMiddleware(req, res, next)
  })

  return {
    schemaManager: manager,
    apolloServer,
    expressApp,
    async listen(port: number) {
      const httpServer = http.createServer(expressApp)
      await new Promise<void>((resolve, reject) => {
        httpServer.once('error', reject)
        httpServer.listen(port, () => resolve())
      })
      return {
        async close() {
          await new Promise<void>((resolve, reject) => {
            httpServer.close((err) => (err ? reject(err) : resolve()))
          })
          await apolloServer.stop()
        },
      }
    },
  }
}
