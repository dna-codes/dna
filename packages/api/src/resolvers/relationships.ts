/**
 * Relationship-expansion resolvers.
 *
 * GraphQL field on `Loan.borrower` resolves via:
 *
 *   1. List Links from `(Loan, parent.id)` filtered by the relationship's
 *      `role` (the DNA `Relationship.name`).
 *   2. For each Link, look up the target Instance via
 *      `store.instance.get(toType, link.to.id)`.
 *   3. Return the resolved Instance(s). Single-cardinality returns the
 *      first match (or `null`); list-cardinality returns the array.
 */

import type { DnaDataStore } from '@dna-codes/dna-core'
import type { GraphQLFieldResolver } from 'graphql'

import type { RelationshipFieldInfo } from '../schema/relationships'

interface RelationshipResolverArgs {
  dataStore: DnaDataStore
  info: RelationshipFieldInfo
}

export function makeRelationshipResolver({
  dataStore,
  info,
}: RelationshipResolverArgs): GraphQLFieldResolver<unknown, unknown> {
  return async (parent) => {
    const parentRecord = parent as { id?: unknown } | null | undefined
    const parentId = parentRecord?.id
    if (typeof parentId !== 'string' || parentId.length === 0) {
      return info.isList ? [] : null
    }
    const links = await dataStore.link.list({
      from: { typeName: info.fromType, id: parentId },
      role: info.relationshipName,
    })
    if (info.isList) {
      const resolved = await Promise.all(
        links.map((l) => dataStore.instance.get(info.toType, l.to.id)),
      )
      return resolved.filter((r) => r !== null)
    }
    const first = links[0]
    if (!first) return null
    return dataStore.instance.get(info.toType, first.to.id)
  }
}
