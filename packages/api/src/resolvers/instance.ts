/**
 * Instance-CRUD resolvers. Every function returns a GraphQL resolver
 * that closes over an injected `DnaDataStore`. No store imports outside
 * this module's factory functions — the schema composer wires the
 * dependency in one place.
 */

import type { DnaDataStore } from '@dna-codes/dna-core'
import type { GraphQLFieldResolver } from 'graphql'

interface CrudArgs {
  dataStore: DnaDataStore
  typeName: string
}

export function makeGetResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_parent, args) => {
    const id = String((args as { id: unknown }).id)
    return dataStore.instance.get(typeName, id)
  }
}

export function makeListResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown> {
  return async () => {
    return dataStore.instance.list(typeName)
  }
}

export function makeCreateResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_parent, args) => {
    const input = (args as { input: Record<string, unknown> }).input ?? {}
    const { id } = await dataStore.instance.create(typeName, input)
    return dataStore.instance.get(typeName, id)
  }
}

export function makeUpdateResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_parent, args) => {
    const { id, input } = args as { id: unknown; input: Record<string, unknown> }
    const sid = String(id)
    await dataStore.instance.update(typeName, sid, input ?? {})
    return dataStore.instance.get(typeName, sid)
  }
}

export function makeDeleteResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_parent, args) => {
    const id = String((args as { id: unknown }).id)
    await dataStore.instance.delete(typeName, id)
    return true
  }
}
