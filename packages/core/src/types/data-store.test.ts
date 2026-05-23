/**
 * Type-level tests for the `DnaDataStore` interface. These assertions live
 * in a `.test.ts` so they participate in the Jest run (failing types break
 * compilation, which fails the test build). They have no runtime
 * expectations beyond a smoke check that the structure is importable.
 */

import type {
  DnaDataStore,
  InstanceCreateInput,
  InstanceRecord,
  InstanceRef,
  LinkCreateOptions,
  LinkListFilter,
  LinkRecord,
} from './data-store'

describe('DnaDataStore type contract', () => {
  it('declares the expected method shape', () => {
    // Compile-time-only check: a stub implementing the interface must satisfy
    // every method signature below.
    const stub: DnaDataStore = {
      migrate: async () => undefined,
      instance: {
        create: async (typeName: string, data: InstanceCreateInput): Promise<{ id: string }> => {
          void typeName
          return { id: data.id ?? 'generated-id' }
        },
        get: async (typeName: string, id: string): Promise<InstanceRecord | null> => {
          void typeName
          void id
          return null
        },
        update: async (typeName: string, id: string, patch: Record<string, unknown>): Promise<void> => {
          void typeName
          void id
          void patch
        },
        delete: async (typeName: string, id: string): Promise<void> => {
          void typeName
          void id
        },
        list: async (typeName: string): Promise<InstanceRecord[]> => {
          void typeName
          return []
        },
      },
      link: {
        create: async (
          from: InstanceRef,
          to: InstanceRef,
          opts?: LinkCreateOptions,
        ): Promise<{ id: string }> => {
          void from
          void to
          return { id: opts?.id ?? 'generated-link-id' }
        },
        delete: async (linkId: string): Promise<void> => {
          void linkId
        },
        list: async (filter?: LinkListFilter): Promise<LinkRecord[]> => {
          void filter
          return []
        },
      },
      close: async () => undefined,
    }

    expect(typeof stub.migrate).toBe('function')
    expect(typeof stub.instance.create).toBe('function')
    expect(typeof stub.link.create).toBe('function')
  })

  it('hybrid create input accepts id-less payloads', () => {
    const withoutId: InstanceCreateInput = { amount: 1000 }
    const withId: InstanceCreateInput = { id: 'loan-42', amount: 1000 }
    expect(withoutId).toBeDefined()
    expect(withId.id).toBe('loan-42')
  })

  it('link list filter is fully optional', () => {
    const empty: LinkListFilter = {}
    const partial: LinkListFilter = { role: 'primary_borrower' }
    const full: LinkListFilter = {
      from: { typeName: 'Loan', id: 'l1' },
      to: { typeName: 'Borrower', id: 'b1' },
      role: 'primary_borrower',
    }
    expect(empty).toBeDefined()
    expect(partial.role).toBe('primary_borrower')
    expect(full.from?.typeName).toBe('Loan')
  })
})
