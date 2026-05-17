import type { OperationalDNA } from '../types/merge'
import type { Person, PrimitiveInput } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Person template to the DNA's `domain.persons`. Same-name composes
 * via merge rules.
 */
export function addPerson(
  dna: OperationalDNA,
  person: PrimitiveInput<Person>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, person, 'persons', 'operational/person', opts)
}
