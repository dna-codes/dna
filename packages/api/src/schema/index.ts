/**
 * Schema composition entry point.
 *
 * Builds a GraphQL schema from an `OperationalDNA` and an injected
 * `DnaDataStore`. The order of operations matters:
 *
 *   1. Validate DNA via `DnaValidator` (fails fast on malformed input).
 *   2. Build per-noun-primitive types + inputs + enums.
 *   3. Plan relationship fields, build their resolvers, and extend the
 *      object types in the registry with the expansion fields.
 *   4. Build CRUD queries + mutations with resolvers.
 *   5. Build Operation mutations; collisions resolve to the Operation.
 *   6. Assemble into a `GraphQLSchema` with `Query` + `Mutation`
 *      root types.
 */

import {
  GraphQLObjectType,
  GraphQLSchema,
  type GraphQLFieldConfig,
} from 'graphql'

import { DnaValidator, type DnaDataStore, type OperationalDNA } from '@dna-codes/dna-core'

import { makeCreateResolver, makeDeleteResolver, makeGetResolver, makeListResolver, makeUpdateResolver } from '../resolvers/instance'
import { makeOperationResolver } from '../resolvers/operations'
import { makeRelationshipResolver } from '../resolvers/relationships'
import { buildCrudFields, type CrudResolverFactories } from './crud'
import { buildOperationMutations, type OperationResolverFactory } from './operations'
import { buildRelationshipFieldConfigs, extendObjectFields, planRelationshipFields } from './relationships'
import { buildResourceTypes } from './types'

const OPERATIONAL_SCHEMA_ID = 'https://dna.codes/schemas/operational'

export interface BuildSchemaArgs {
  dna: OperationalDNA
  dataStore: DnaDataStore
  /** Skip the up-front DNA validation. Tests use this when fixtures intentionally omit base-contract fields. Default false. */
  skipValidation?: boolean
}

export function buildSchema({ dna, dataStore, skipValidation = false }: BuildSchemaArgs): GraphQLSchema {
  if (!skipValidation) {
    const validator = new DnaValidator()
    const result = validator.validate(dna, OPERATIONAL_SCHEMA_ID)
    if (!result.valid) {
      const detail = result.errors
        .map((e) => `  - ${e.instancePath || '/'}: ${e.message}`)
        .join('\n')
      throw new Error(`dna-api: supplied DNA failed validation:\n${detail}`)
    }
  }

  // §2 — types, inputs, enums.
  const bundle = buildResourceTypes(dna)

  // §3 — relationship expansion fields.
  const relationshipBuilders = planRelationshipFields(dna, bundle)
  const relationshipFieldConfigs = buildRelationshipFieldConfigs(
    relationshipBuilders,
    (info) => makeRelationshipResolver({ dataStore, info }),
  )
  extendObjectFields(bundle, relationshipFieldConfigs)

  // §4 — generic CRUD.
  const crudResolvers: CrudResolverFactories = {
    get: (typeName) => makeGetResolver({ dataStore, typeName }),
    list: (typeName) => makeListResolver({ dataStore, typeName }),
    create: (typeName) => makeCreateResolver({ dataStore, typeName }),
    update: (typeName) => makeUpdateResolver({ dataStore, typeName }),
    delete: (typeName) => makeDeleteResolver({ dataStore, typeName }),
  }
  const crud = buildCrudFields(bundle, crudResolvers)

  // §5 — Operation mutations (may shadow CRUD per D3).
  const operationResolvers: OperationResolverFactory = {
    forTarget: (targetType) => makeOperationResolver({ dataStore, targetType }),
  }
  const opBundle = buildOperationMutations(dna, bundle, operationResolvers, crud.crudMutationNames)

  // Drop any CRUD mutation that an Operation shadowed (per D3).
  const finalCrudMutations: Record<string, GraphQLFieldConfig<unknown, unknown>> = {}
  for (const [name, field] of Object.entries(crud.mutations)) {
    if (opBundle.crudMutationsToOmit.has(name)) continue
    finalCrudMutations[name] = field
  }

  const mutationFields = { ...finalCrudMutations, ...opBundle.mutations }

  // If a DNA declares zero queries / mutations (e.g. no noun primitives),
  // GraphQL still wants an object with at least one field. Synthesize a
  // `_meta` field as a fallback so the schema is constructible.
  const queryFields =
    Object.keys(crud.queries).length > 0
      ? crud.queries
      : { _meta: emptyMetaField('No queries available — the DNA declares no noun primitives.') }

  const mutationType =
    Object.keys(mutationFields).length > 0
      ? new GraphQLObjectType({ name: 'Mutation', fields: mutationFields })
      : undefined

  return new GraphQLSchema({
    query: new GraphQLObjectType({ name: 'Query', fields: queryFields }),
    ...(mutationType ? { mutation: mutationType } : {}),
    // Include every object type explicitly so the introspection includes
    // them even if no field references them directly (defensive).
    types: [...bundle.registry.values()],
  })
}

function emptyMetaField(description: string): GraphQLFieldConfig<unknown, unknown> {
  return {
    type: require('graphql').GraphQLString,
    resolve: () => description,
    description,
  }
}
