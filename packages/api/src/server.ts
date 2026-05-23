/**
 * Apollo Server v5 + Express HTTP integration.
 *
 * `createServer({ dna, dataStore })`:
 *   1. Builds the GraphQL schema from the DNA (validates DNA first).
 *   2. Calls `dataStore.migrate()` so the store backend is ready before
 *      requests arrive.
 *   3. Returns the composed Apollo server, an Express app with
 *      `/graphql` and `/healthz` mounted, and a `listen(port)` helper.
 *
 * The function NEVER instantiates a `DnaDataStore` directly — the caller
 * (CLI or a test harness) constructs the store and passes it in.
 */

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4'
import bodyParser from 'body-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import type { GraphQLSchema } from 'graphql'
import http from 'http'

import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core'

import { buildSchema } from './schema'

export interface CreateServerArgs {
  dna: OperationalDNA
  dataStore: DnaDataStore
  /** Skip DNA validation (tests with intentionally minimal fixtures). Default false. */
  skipDnaValidation?: boolean
}

export interface CreatedServer {
  schema: GraphQLSchema
  apolloServer: ApolloServer
  expressApp: Express
  listen(port: number): Promise<{ close(): Promise<void> }>
}

export async function createServer(args: CreateServerArgs): Promise<CreatedServer> {
  const { dna, dataStore, skipDnaValidation = false } = args

  // 1 + 2: schema build (validates DNA) and store migrate.
  const schema = buildSchema({ dna, dataStore, skipValidation: skipDnaValidation })
  await dataStore.migrate()

  // 3: Apollo + Express composition (Apollo Server v5 unbundles HTTP).
  const apolloServer = new ApolloServer({ schema })
  await apolloServer.start()

  const expressApp = express()
  expressApp.use(cors())
  expressApp.use(bodyParser.json())
  expressApp.get('/healthz', (_req, res) => {
    res.status(200).send('ok')
  })
  expressApp.use('/graphql', expressMiddleware(apolloServer))

  return {
    schema,
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
