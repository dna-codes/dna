/**
 * Compiled-ajv-validator cache keyed by `(resourceTypeId, version)`.
 *
 * Validation runs on every `create<Type>` and `update<Type>` mutation;
 * compiling ajv on every call would be wasteful. The cache compiles
 * once per (type, version) pair and reuses the validator. Updates to a
 * `ResourceType` bump the version so the new schema gets a fresh cache
 * entry on the first write.
 *
 * Memory grows with the number of distinct (type, version) pairs ever
 * touched — bounded in practice by tenant size. An LRU bound is left
 * for a follow-on if a benchmark says it matters.
 */

import Ajv, { type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

import type { AttributeSchema } from '@dna-codes/dna-core'

import { attributeSchemaToJsonSchema } from './attribute-schema-to-jsonschema'

interface CacheEntry {
  version: number
  validate: ValidateFunction
}

export class ValidatorCache {
  private ajv: Ajv
  private byTypeId = new Map<string, CacheEntry>()

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false })
    addFormats(this.ajv)
  }

  /**
   * Compile (or return cached) a validator for `(typeId, version)` against
   * the supplied schema. If a newer version is supplied for the same
   * typeId, the previous entry is replaced.
   */
  getOrCompile(typeId: string, version: number, schema: AttributeSchema): ValidateFunction {
    const existing = this.byTypeId.get(typeId)
    if (existing && existing.version === version) return existing.validate
    const jsonSchema = attributeSchemaToJsonSchema(schema)
    const validate = this.ajv.compile(jsonSchema)
    this.byTypeId.set(typeId, { version, validate })
    return validate
  }

  /** Drop any cached entry for a typeId — used when a ResourceType is deleted. */
  invalidate(typeId: string): void {
    this.byTypeId.delete(typeId)
  }

  /** Drop all cached entries. */
  clear(): void {
    this.byTypeId.clear()
  }
}

/**
 * Convert ajv errors into a single human-readable string suitable for
 * surfacing as a GraphQL error message.
 */
export function formatAjvErrors(validate: ValidateFunction): string {
  const errors = validate.errors ?? []
  if (errors.length === 0) return 'Validation failed.'
  return errors
    .map((e) => `  - ${e.instancePath || '/'}: ${e.message ?? 'invalid'}`)
    .join('\n')
}
