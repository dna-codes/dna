import { DnaValidator } from './validator'
import type { Resource } from './types/operational'

const validator = new DnaValidator()
const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('operational/base — universal base contract', () => {
  it('rejects a primitive missing id', () => {
    const result = validator.validate(
      { type: 'resource', version: '1', name: 'Loan' },
      'operational/resource',
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'id')).toBe(true)
  })

  it('rejects a primitive missing type', () => {
    const result = validator.validate(
      { id: TEST_UUID, version: '1', name: 'Loan' },
      'operational/resource',
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'type')).toBe(true)
  })

  it('rejects a primitive missing version', () => {
    const result = validator.validate(
      { id: TEST_UUID, type: 'resource', name: 'Loan' },
      'operational/resource',
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'version')).toBe(true)
  })

  it('rejects an id that is not a UUID', () => {
    const result = validator.validate(
      { id: 'not-a-uuid', type: 'resource', version: '1', name: 'Loan' },
      'operational/resource',
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.keyword === 'format' && e.params?.format === 'uuid')).toBe(true)
  })

  it('rejects an unknown field via unevaluatedProperties', () => {
    const result = validator.validate(
      { id: TEST_UUID, type: 'resource', version: '1', name: 'Loan', bogus: 'oops' },
      'operational/resource',
    )
    expect(result.valid).toBe(false)
    expect(
      result.errors.some(
        e => e.keyword === 'unevaluatedProperties' && e.params?.unevaluatedProperty === 'bogus',
      ),
    ).toBe(true)
  })

  it('rejects a Resource whose `type` is not the literal "resource"', () => {
    const result = validator.validate(
      { id: TEST_UUID, type: 'operation', version: '1', name: 'Loan' },
      'operational/resource',
    )
    expect(result.valid).toBe(false)
  })

  it('accepts a primitive with all base fields and the correct discriminator', () => {
    const result = validator.validate(
      { id: TEST_UUID, type: 'resource', version: '1', name: 'Loan' },
      'operational/resource',
    )
    expect(result.valid).toBe(true)
  })
})

describe('TypeScript narrowing of `type`', () => {
  it('narrows Resource.type to the literal "resource"', () => {
    // Compile-time check: assigning the wrong literal must fail. The
    // commented block below is intentionally not active; uncommenting it
    // should produce a TS error.
    //
    //   const r: Resource = { id: 'x', type: 'operation', version: '1', name: 'Loan' }
    //   // ^ TS2322: Type '"operation"' is not assignable to type '"resource"'
    //
    // Runtime version of the same narrowing:
    const r: Resource = { id: TEST_UUID, type: 'resource', version: '1', name: 'Loan' }
    const t: 'resource' = r.type
    expect(t).toBe('resource')
  })
})
