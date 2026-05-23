/**
 * Operation-mutation resolver.
 *
 * v1 behavior: forwards to `store.instance.update(target, id, input)` and
 * re-reads the record. Operation `changes[]` semantics (state-machine
 * enforcement) and Rule enforcement are deferred to a follow-on
 * proposal — see design.md D3.
 */

import type { DnaDataStore } from '@dna-codes/dna-core'
import type { GraphQLFieldResolver } from 'graphql'

interface OperationResolverArgs {
  dataStore: DnaDataStore
  targetType: string
}

export function makeOperationResolver({
  dataStore,
  targetType,
}: OperationResolverArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (_parent, args) => {
    const { id, input } = args as { id: unknown; input: Record<string, unknown> }
    const sid = String(id)
    await dataStore.instance.update(targetType, sid, input ?? {})
    return dataStore.instance.get(targetType, sid)
  }
}
