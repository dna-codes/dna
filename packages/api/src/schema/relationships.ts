/**
 * `RelationshipType` records → GraphQL expansion fields codegen.
 *
 * For each `RelationshipType` record (typically from
 * `dataStore.relationshipType.list()`), the codegen adds an expansion
 * field on the `from` ResourceType's GraphQL type. Cardinality drives
 * single-vs-list (many-to-one/one-to-one → single; the others → list).
 *
 * The field name is derived from the relationship's `attribute` field
 * (trailing `_id` stripped, camelCased). The resolver factory is wired
 * by the schema composer in `./index.ts`.
 */

import {
  GraphQLList,
  GraphQLNonNull,
  type GraphQLFieldConfig,
  type GraphQLObjectType,
  type GraphQLOutputType,
} from 'graphql'

import type { RelationshipType } from '@dna-codes/dna-core'

import { stripIdSuffix } from './naming'
import type { ResourceTypeBundle } from './types'

export interface RelationshipFieldInfo {
  fromType: string
  toType: string
  fieldName: string
  relationshipName: string
  cardinality: RelationshipType['cardinality']
  isList: boolean
}

export interface RelationshipFieldBuilder {
  fromType: string
  fieldName: string
  fieldType: GraphQLOutputType
  info: RelationshipFieldInfo
}

/**
 * Compute relationship-field metadata from live `RelationshipType` records.
 * Returns one entry per `RelationshipType` whose `from` AND `to` types both
 * exist in the bundle.
 */
export function planRelationshipFields(
  relationshipTypes: RelationshipType[],
  bundle: ResourceTypeBundle,
): RelationshipFieldBuilder[] {
  const out: RelationshipFieldBuilder[] = []
  for (const rrt of relationshipTypes) {
    const fromType = bundle.registry.get(rrt.from)
    const toType = bundle.registry.get(rrt.to)
    if (!fromType || !toType) continue

    const isList = rrt.cardinality === 'one-to-many' || rrt.cardinality === 'many-to-many'
    const fieldName = stripIdSuffix(rrt.attribute)
    const fieldType: GraphQLOutputType = isList
      ? new GraphQLList(new GraphQLNonNull(toType))
      : toType

    out.push({
      fromType: rrt.from,
      fieldName,
      fieldType,
      info: {
        fromType: rrt.from,
        toType: rrt.to,
        fieldName,
        relationshipName: rrt.name,
        cardinality: rrt.cardinality,
        isList,
      },
    })
  }
  return out
}

export function buildRelationshipFieldConfigs(
  builders: RelationshipFieldBuilder[],
  resolverFor: (info: RelationshipFieldInfo) => GraphQLFieldConfig<unknown, unknown>['resolve'],
): Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>> {
  const grouped = new Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>>()
  for (const b of builders) {
    const existing = grouped.get(b.fromType) ?? {}
    existing[b.fieldName] = {
      type: b.fieldType,
      resolve: resolverFor(b.info),
    }
    grouped.set(b.fromType, existing)
  }
  return grouped
}

export function extendObjectFields(
  bundle: ResourceTypeBundle,
  additions: Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>>,
): void {
  for (const [typeName, addedFields] of additions) {
    const objectType = bundle.registry.get(typeName)
    if (!objectType) continue
    const config = objectType.toConfig()
    const existingFields = config.fields
    const newFields = { ...existingFields, ...addedFields }
    const updated = new (objectType.constructor as {
      new (cfg: unknown): GraphQLObjectType
    })({
      ...config,
      fields: newFields,
    })
    bundle.registry.set(typeName, updated)
  }
}
