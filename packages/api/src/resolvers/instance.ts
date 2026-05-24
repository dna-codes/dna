/**
 * Instance-CRUD resolvers. Every factory returns a GraphQL resolver that
 * closes over an injected `DnaDataStore` and (for write methods) a
 * `ValidatorCache` that compiles ajv validators per
 * `(resourceTypeId, current_version)` pair.
 *
 * Validation timing: per design.md D6, write resolvers validate the input
 * `data` against the live `ResourceType.attribute_schema` at its
 * `current_version` before invoking the store. Read resolvers don't
 * validate — they return whatever is in the store.
 */

import type { DnaDataStore } from '@dna-codes/dna-core'
import { GraphQLError, type GraphQLFieldResolver } from 'graphql'

import { formatAjvErrors, type ValidatorCache } from '../validation/validator-cache'

interface ReadArgs {
  dataStore: DnaDataStore
  typeName: string
}

interface WriteArgs extends ReadArgs {
  validatorCache: ValidatorCache
}

export function makeGetResolver({ dataStore, typeName }: ReadArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_p, args) => {
    const id = String((args as { id: unknown }).id)
    return dataStore.instance.get(typeName, id)
  }
}

export function makeListResolver({ dataStore, typeName }: ReadArgs): GraphQLFieldResolver<unknown, unknown> {
  return async () => dataStore.instance.list(typeName)
}

async function validateOrThrow(
  dataStore: DnaDataStore,
  validatorCache: ValidatorCache,
  typeName: string,
  input: Record<string, unknown>,
): Promise<void> {
  const rts = await dataStore.resourceType.list()
  const rt = rts.find((r) => r.name === typeName)
  if (!rt) {
    throw new GraphQLError(
      `No ResourceType named "${typeName}" exists. Create one via createResourceType first.`,
    )
  }
  const validate = validatorCache.getOrCompile(rt.id, rt.current_version, rt.attribute_schema)
  // Strip control fields before validating against the user-facing schema.
  const { id: _id, _schemaVersion: _v, ...payload } = input
  void _id
  void _v
  if (!validate(payload)) {
    throw new GraphQLError(`Validation failed for ${typeName}:\n${formatAjvErrors(validate)}`)
  }
}

export function makeCreateResolver({
  dataStore,
  typeName,
  validatorCache,
}: WriteArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_p, args) => {
    const input = (args as { input: Record<string, unknown> }).input ?? {}
    await validateOrThrow(dataStore, validatorCache, typeName, input)
    const { id } = await dataStore.instance.create(typeName, input)
    return dataStore.instance.get(typeName, id)
  }
}

export function makeUpdateResolver({
  dataStore,
  typeName,
  validatorCache,
}: WriteArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_p, args) => {
    const { id, input } = args as { id: unknown; input: Record<string, unknown> }
    const sid = String(id)
    await validateOrThrow(dataStore, validatorCache, typeName, input ?? {})
    await dataStore.instance.update(typeName, sid, input ?? {})
    return dataStore.instance.get(typeName, sid)
  }
}

export function makeDeleteResolver({ dataStore, typeName }: ReadArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_p, args) => {
    const id = String((args as { id: unknown }).id)
    await dataStore.instance.delete(typeName, id)
    return true
  }
}
