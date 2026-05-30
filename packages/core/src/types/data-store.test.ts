/**
 * Type-level tests for the registry-native `DnaDataStore` interface. These
 * assertions live in a `.test.ts` so they participate in the Jest run
 * (failing types break compilation, which fails the test build). They have
 * no runtime expectations beyond a smoke check that the structure is
 * importable.
 */

import type {
  DnaDataStore,
  InstanceCreateInput,
  InstanceRecord,
  InstanceRef,
  LinkCreateOptions,
  LinkListFilter,
  LinkRecord,
  ResourceType,
  ResourceTypeInput,
  ResourceTypeVersion,
  RelationshipType,
  RelationshipTypeInput,
  RelationshipTypeVersion,
  SeedReport,
} from './data-store'

import {
  defaultStabilityForType,
  isFoundationalTypeName,
  STABILITIES,
  TypeInUseError,
} from './data-store'

function makeResourceType(name: string): ResourceType {
  return {
    id: 'rt-1',
    name,
    category: 'resource',
    attribute_schema: [{ name: 'foo', type: 'string' }],
    current_version: 1,
    stability: 'experimental',
    is_seed: false,
  }
}

function makeRelationshipType(): RelationshipType {
  return {
    id: 'rrt-1',
    name: 'Loan.borrower',
    from: 'Loan',
    to: 'Borrower',
    cardinality: 'many-to-one',
    attribute: 'borrower_id',
    current_version: 1,
    stability: 'experimental',
    is_seed: false,
  }
}

describe('DnaDataStore type contract', () => {
  it('declares the expected method shape', () => {
    // Compile-time-only check: a stub implementing the interface must satisfy
    // every method signature below.
    const stub: DnaDataStore = {
      migrate: async () => undefined,
      seedFromDna: async (): Promise<SeedReport> => ({
        resourceTypesCreated: 0,
        resourceTypesSkipped: 0,
        relationshipTypesCreated: 0,
        relationshipTypesSkipped: 0,
      }),
      hasBeenSeeded: async () => false,
      resourceType: {
        create: async (input: ResourceTypeInput) => ({ id: input.id ?? 'generated' }),
        get: async (): Promise<ResourceType | null> => null,
        list: async () => [],
        update: async () => undefined,
        setStability: async () => undefined,
        delete: async () => undefined,
        versions: async (): Promise<ResourceTypeVersion[]> => [],
      },
      relationshipType: {
        create: async (input: RelationshipTypeInput) => ({ id: input.id ?? 'generated' }),
        get: async (): Promise<RelationshipType | null> => null,
        list: async () => [],
        update: async () => undefined,
        setStability: async () => undefined,
        delete: async () => undefined,
        versions: async (): Promise<RelationshipTypeVersion[]> => [],
      },
      instance: {
        create: async (_t: string, data: InstanceCreateInput) => ({ id: data.id ?? 'generated' }),
        get: async (): Promise<InstanceRecord | null> => null,
        update: async () => undefined,
        delete: async () => undefined,
        list: async () => [],
      },
      link: {
        create: async (_from: InstanceRef, _to: InstanceRef, opts?: LinkCreateOptions) => ({
          id: opts?.id ?? 'generated',
        }),
        delete: async () => undefined,
        list: async (_filter?: LinkListFilter): Promise<LinkRecord[]> => [],
      },
      close: async () => undefined,
    }

    expect(typeof stub.migrate).toBe('function')
    expect(typeof stub.seedFromDna).toBe('function')
    expect(typeof stub.hasBeenSeeded).toBe('function')
    expect(typeof stub.resourceType.create).toBe('function')
    expect(typeof stub.relationshipType.create).toBe('function')
    expect(typeof stub.instance.create).toBe('function')
    expect(typeof stub.link.create).toBe('function')
  })

  it('ResourceType records carry current_version and is_seed', () => {
    const rt = makeResourceType('Loan')
    expect(rt.current_version).toBe(1)
    expect(rt.is_seed).toBe(false)
    expect(rt.category).toBe('resource')
  })

  it('RelationshipType records carry from / to / cardinality', () => {
    const rrt = makeRelationshipType()
    expect(rrt.from).toBe('Loan')
    expect(rrt.to).toBe('Borrower')
    expect(rrt.cardinality).toBe('many-to-one')
  })

  it('TypeInUseError is constructible and carries inUseCount + typeName', () => {
    const err = new TypeInUseError('Loan', 3)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('TypeInUseError')
    expect(err.typeName).toBe('Loan')
    expect(err.inUseCount).toBe(3)
    expect(err.message).toContain('Loan')
    expect(err.message).toContain('3')
  })

  it('registry types carry a stability marker', () => {
    expect(makeResourceType('Loan').stability).toBe('experimental')
    expect(makeRelationshipType().stability).toBe('experimental')
  })

  it('STABILITIES lists the four lifecycle stages in order', () => {
    expect(STABILITIES).toEqual(['experimental', 'beta', 'stable', 'deprecated'])
  })

  it('foundational types default to stable, everything else to experimental', () => {
    for (const name of ['Person', 'Role', 'Group', 'Resource']) {
      expect(isFoundationalTypeName(name)).toBe(true)
      expect(defaultStabilityForType(name)).toBe('stable')
    }
    expect(isFoundationalTypeName('Loan')).toBe(false)
    expect(defaultStabilityForType('Loan')).toBe('experimental')
    expect(defaultStabilityForType('Loan.borrower')).toBe('experimental')
  })

  it('InstanceRecord can carry _schemaVersion', () => {
    const rec: InstanceRecord = { id: 'x', _schemaVersion: 2, foo: 'bar' }
    expect(rec._schemaVersion).toBe(2)
  })

  it('LinkRecord can carry _schemaVersion', () => {
    const link: LinkRecord = {
      id: 'l1',
      from: { typeName: 'Loan', id: 'l' },
      to: { typeName: 'Borrower', id: 'b' },
      _schemaVersion: 1,
    }
    expect(link._schemaVersion).toBe(1)
  })
})
