import { randomUUID } from 'node:crypto'
import { merge } from '../merge'
import type { Conflict, OperationalDNA } from '../types/merge'
import { OPERATIONAL_PRIMITIVE_VERSIONS, type OperationalPrimitiveType } from '../version'
import { DnaValidator } from '../validator'

/** Generates a UUID v4. Wrapped here so builder tests can stub identity. */
export function generateId(): string {
  return randomUUID()
}

/**
 * Stamp the universal base contract (`id`, `type`, `version`) onto a
 * primitive when not already supplied. Caller values win; idempotent.
 */
export function stampBaseFields<T extends object>(
  primitive: T,
  type: OperationalPrimitiveType,
): T & { id: string; type: OperationalPrimitiveType; version: string } {
  const p = primitive as Record<string, unknown>
  return {
    ...primitive,
    id: typeof p.id === 'string' ? p.id : generateId(),
    type: typeof p.type === 'string' ? (p.type as OperationalPrimitiveType) : type,
    version: typeof p.version === 'string' ? p.version : OPERATIONAL_PRIMITIVE_VERSIONS[type],
  } as T & { id: string; type: OperationalPrimitiveType; version: string }
}

let cachedValidator: DnaValidator | null = null

function validator(): DnaValidator {
  if (cachedValidator === null) cachedValidator = new DnaValidator()
  return cachedValidator
}

export interface BuilderOptions {
  /**
   * Validate the primitive against `@dna-codes/dna-schemas` before composing.
   * Default `true`. Hot paths (e.g. `merge()`'s emit loop) opt out via
   * `{ validate: false }` when inputs are already known to validate.
   */
  validate?: boolean
}

export interface BuilderResult {
  dna: OperationalDNA
  conflicts: Conflict[]
}

const NOUN_COLLECTIONS = new Set(['resources', 'persons', 'roles', 'groups'] as const)

type NounCollection = 'resources' | 'persons' | 'roles' | 'groups'
type ActivityCollection =
  | 'memberships'
  | 'operations'
  | 'triggers'
  | 'rules'
  | 'tasks'
  | 'processes'
  | 'relationships'

export type BuilderCollection = NounCollection | ActivityCollection

/**
 * Compose a single primitive into a DNA. Used by every `add*` builder.
 *
 * - Validates the primitive against its JSON Schema by default.
 * - Wraps the primitive in a single-primitive DNA chunk that inherits the
 *   target DNA's `domain.name` (so `merge()` doesn't surface a spurious
 *   conflict on the domain name itself).
 * - Calls `merge([dna, wrapper])`. Identity-by-name + conflict reporting +
 *   cross-reference resolution all flow from `merge()`'s existing logic.
 * - Drops the provenance map — builders don't carry source info; `merge()`
 *   handles provenance for the multi-source case directly.
 */
/**
 * Map from builder collection name (plural) to the primitive type literal
 * stamped as `type` on each primitive. Derived from the schema id segment
 * for `operations`/`relationships`/etc.
 */
const COLLECTION_TO_TYPE: Record<BuilderCollection, OperationalPrimitiveType> = {
  resources: 'resource',
  persons: 'person',
  roles: 'role',
  groups: 'group',
  memberships: 'membership',
  operations: 'operation',
  triggers: 'trigger',
  rules: 'rule',
  tasks: 'task',
  processes: 'process',
  relationships: 'relationship',
}

export function composeInto(
  dna: OperationalDNA,
  primitive: unknown,
  collection: BuilderCollection,
  schemaId: string,
  opts: BuilderOptions = {},
): BuilderResult {
  const stamped =
    primitive && typeof primitive === 'object'
      ? stampBaseFields(primitive as object, COLLECTION_TO_TYPE[collection])
      : primitive

  if (opts.validate !== false) {
    const result = validator().validate(stamped, schemaId)
    if (!result.valid) {
      const message = result.errors
        .map((e) => `${e.instancePath || '/'} ${e.message ?? '(no message)'}`)
        .join('; ')
      throw new Error(`dna-builders: ${schemaId} input failed validation: ${message}`)
    }
  }

  const domainName = dna.domain.name
  const wrapper: OperationalDNA = NOUN_COLLECTIONS.has(collection as NounCollection)
    ? {
        domain: { name: domainName, [collection]: [stamped] },
      }
    : {
        domain: { name: domainName },
        [collection]: [stamped],
      }

  const result = merge([dna, wrapper])
  return { dna: result.dna, conflicts: result.conflicts }
}
