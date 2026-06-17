import {
  addRelationship,
  addResource,
  createOperationalDna,
  type Attribute,
  type AttributeType,
  type OperationalDNA,
  type PrimitiveInput,
  type Relationship,
  type RelationshipCardinality,
} from '@dna-codes/dna-core'
import { ParsedRelationship, ParsedResource, ParseResult } from './types'

export interface ParseOptions {
  /** Name for the root Resource. Required — input JSON doesn't name itself. */
  name: string
  /** Domain name wrapping the inferred Resources. Defaults to options.name lowercased. */
  domain?: string
  /** Map a property key to the Resource name it references. Default: PascalCase, singularized. */
  resourceNameFromKey?: (key: string) => string
}

/**
 * Walk a JSON sample and infer DNA Resources + Relationships from it.
 *
 * The walker no longer maintains its own `Map<name, Resource>` or per-attribute
 * `seen` set — it composes a single OperationalDNA via the `addResource` /
 * `addRelationship` builders from `@dna-codes/dna-core`. Same-named primitives
 * compose by name; same-keyed attributes within a Resource union via the
 * builder's underlying merge rules. The walker's only correctness concern is
 * deciding whether each JSON key becomes a scalar Attribute, a reference
 * Attribute + child Resource recursion, or is dropped (arrays of scalars).
 */
export function parse(data: unknown, options: ParseOptions): ParseResult {
  if (!isRecord(data) && !Array.isArray(data)) {
    throw new Error('input-json.parse: input must be a JSON object or array of objects.')
  }

  const domainName = options.domain ?? options.name.toLowerCase()
  let dna: OperationalDNA = createOperationalDna({ domain: { name: domainName } })

  const rootSample = Array.isArray(data) ? mergeRecords(data) : data
  dna = walk(rootSample, options.name, dna, options)

  const resources = ((dna.resources ?? []) as ParsedResource[])
  const relationships = ((dna.relationships ?? []) as ParsedRelationship[])

  return {
    operational: {
      domain: { name: domainName },
      resources,
      ...(relationships.length ? { relationships } : {}),
    },
  }
}

function walk(
  data: Record<string, unknown>,
  resourceName: string,
  dna: OperationalDNA,
  options: ParseOptions,
): OperationalDNA {
  for (const [key, value] of Object.entries(data)) {
    if (isRecord(value)) {
      const childName = deriveResourceName(key, options)
      dna = addResource(dna, {
        name: resourceName,
        attributes: [{ name: key, type: 'reference', resource: childName }],
      }).dna
      dna = addRelationship(dna, buildRelationship(resourceName, childName, key, 'one-to-one')).dna
      dna = walk(value, childName, dna, options)
      continue
    }

    if (Array.isArray(value)) {
      if (value.length > 0 && isRecord(value[0])) {
        const childName = deriveResourceName(key, options)
        dna = addResource(dna, {
          name: resourceName,
          attributes: [{ name: key, type: 'reference', resource: childName }],
        }).dna
        dna = addRelationship(dna, buildRelationship(resourceName, childName, key, 'one-to-many')).dna
        const merged = mergeRecords(value)
        dna = walk(merged, childName, dna, options)
      }
      // Arrays of scalars (e.g. `tags: ["fantasy", "classic"]`) have no faithful
      // representation as a single DNA Attribute — the canonical schema's
      // type enum is string | text | number | boolean | date | datetime | enum
      // | reference. The DNA way to model scalar collections is a child Resource
      // plus a relationship, which requires more context than a JSON sample
      // provides. Rather than emit invalid DNA, drop these keys.
      continue
    }

    const attr: Attribute = { name: key, type: inferScalarType(value) }
    dna = addResource(dna, { name: resourceName, attributes: [attr] }).dna
  }

  // Ensure the resource exists even if it had no recognizable keys.
  const targetResources = (dna.resources ?? []) as Array<{ name: string }>
  if (!targetResources.some((r) => r.name === resourceName)) {
    dna = addResource(dna, { name: resourceName }).dna
  }

  return dna
}

function buildRelationship(
  from: string,
  to: string,
  attribute: string,
  cardinality: RelationshipCardinality,
): PrimitiveInput<Relationship> {
  return {
    name: `${from}.${attribute}`,
    from,
    to,
    attribute,
    cardinality,
  }
}

function deriveResourceName(key: string, options: ParseOptions): string {
  if (options.resourceNameFromKey) return options.resourceNameFromKey(key)
  return pascalCase(singularize(key))
}

/**
 * Shallow-merge an array of record-shaped values into a single record by
 * picking the first non-null sample for each key. Handles schemas that drift
 * across array items (partial/optional fields).
 */
function mergeRecords(items: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const item of items) {
    if (!isRecord(item)) continue
    for (const [k, v] of Object.entries(item)) {
      if (!(k in out) || out[k] == null) out[k] = v
    }
  }
  return out
}

function inferScalarType(value: unknown): AttributeType {
  if (value == null) return 'string'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'datetime'
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    return 'string'
  }
  return 'string'
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function pascalCase(s: string): string {
  return s
    .split(/[\s\-_./]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

function singularize(s: string): string {
  if (s.endsWith('ies') && s.length > 3) return s.slice(0, -3) + 'y'
  if (s.endsWith('sses')) return s.slice(0, -2)
  if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1)
  return s
}

export * from './types'
