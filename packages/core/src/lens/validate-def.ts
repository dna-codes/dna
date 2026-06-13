/**
 * Validate a lens definition against the `meta/lens` JSON Schema, plus the two
 * semantic rules the schema can't express: pinning is allowed only on data
 * lenses, and every `scope.from` must reference a pinned slot.
 */

import { DnaValidator } from '../validator'
import type { LensDefinition } from './types'

let _validator: DnaValidator | null = null
function validator(): DnaValidator {
  return (_validator ??= new DnaValidator())
}

export interface LensDefValidation {
  valid: boolean
  errors: string[]
}

export function validateLensDefinition(def: LensDefinition): LensDefValidation {
  const errors: string[] = []

  const schemaResult = validator().validate(def, 'meta/lens')
  if (!schemaResult.valid) {
    for (const e of schemaResult.errors) errors.push(`${e.instancePath || '(root)'} ${e.message ?? 'invalid'}`)
  }

  const target = def.target ?? 'data'

  // Pinning (ref) is only allowed on data lenses.
  if (target === 'schema') {
    for (const s of def.nodes ?? []) {
      if (s.ref) errors.push(`slot "${s.slot ?? s.type}" is pinned (ref) but target is "schema"`)
    }
  }

  // scope.from must reference a pinned slot.
  const pinnedSlotNames = new Set(
    (def.nodes ?? []).filter(s => s.ref && s.slot).map(s => s.slot as string),
  )
  for (const sc of def.scope ?? []) {
    if (!pinnedSlotNames.has(sc.from)) {
      errors.push(`scope.from "${sc.from}" does not reference a pinned slot`)
    }
  }

  return { valid: errors.length === 0, errors }
}
