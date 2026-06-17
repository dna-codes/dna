import { merge } from './index'
import type { MergeChunk, OperationalDNA } from '../types/merge'
import { DnaValidator } from '../validator'

const T1 = '2025-01-01T00:00:00.000Z'
const T2 = '2025-06-01T00:00:00.000Z'
const T3 = '2025-12-01T00:00:00.000Z'

function chunk(dna: OperationalDNA, uri: string, loadedAt: string): MergeChunk {
  return { dna, source: { uri, loadedAt } }
}

describe('merge()', () => {
  describe('purity & determinism', () => {
    it('returns deeply-equal output for the same input across calls', () => {
      const dnas: OperationalDNA[] = [
        { domain: { name: 'acme' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }] },
        { domain: { name: 'acme' }, resources: [{ name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] }] },
      ]
      const a = merge(dnas)
      const b = merge(dnas)
      expect(a).toEqual(b)
    })

    it('empty input yields an empty-but-valid Operational DNA', () => {
      const result = merge([])
      expect(result.dna).toEqual({ domain: { name: '' } })
      expect(result.conflicts).toEqual([])
      expect(result.provenance).toEqual({})
    })
  })

  describe('identity-by-name', () => {
    it('two chunks describing Loan unify into one Resource with both attributes', () => {
      const result = merge([
        chunk(
          { domain: { name: 'acme' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }] },
          'gdrive://a',
          T1,
        ),
        chunk(
          { domain: { name: 'acme' }, resources: [{ name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] }] },
          'gdrive://b',
          T2,
        ),
      ])
      const resources = (result.dna.resources ?? []) as Array<Record<string, unknown>>
      expect(resources).toHaveLength(1)
      expect(resources[0].name).toBe('Loan')
      const attrs = resources[0].attributes as Array<{ name: string }>
      expect(attrs.map((a) => a.name).sort()).toEqual(['amount', 'status'])
      expect(result.conflicts).toHaveLength(0)
    })

    it('same-named entries in different types do not unify', () => {
      const result = merge([
        { domain: { name: 'd' }, resources: [{ name: 'Account' }] },
        { domain: { name: 'd' }, persons: [{ name: 'Account' }] },
      ])
      expect((result.dna.resources as unknown[])).toEqual([{ name: 'Account' }])
      expect((result.dna.persons as unknown[])).toEqual([{ name: 'Account' }])
    })

    it('flattens nested sub-domains into the top-level merged domain', () => {
      const dna: OperationalDNA = {
        domain: { name: 'acme',
          domains: [
            { name: 'finance',  },
            { name: 'identity',  },
          ] }, resources: [{ name: 'Loan' }], persons: [{ name: 'Employee' }],
      }
      const result = merge([dna])
      expect(result.dna.resources).toEqual([{ name: 'Loan' }])
      expect(result.dna.persons).toEqual([{ name: 'Employee' }])
    })
  })

  describe('list-shaped union by name', () => {
    it('attributes union by name with recursive merge of attributes already shared', () => {
      const result = merge([
        chunk(
          { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }] },
          'a',
          T1,
        ),
        chunk(
          { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number', required: true }] }] },
          'b',
          T2,
        ),
      ])
      const resources = result.dna.resources as Array<Record<string, unknown>>
      const attrs = resources[0].attributes as Array<Record<string, unknown>>
      expect(attrs).toEqual([{ name: 'amount', type: 'number', required: true }])
      expect(result.conflicts).toHaveLength(0)
    })
  })

  describe('scalar conflict + recommendation policy', () => {
    it('multi-source agreement does not produce a conflict', () => {
      const dna: OperationalDNA = { domain: { name: 'd' }, resources: [{ name: 'Loan', parent: 'FinancialProduct' }] }
      const result = merge([
        chunk(dna, 'a', T1),
        chunk(dna, 'b', T2),
        chunk(dna, 'c', T3),
      ])
      const resources = result.dna.resources as Array<Record<string, unknown>>
      expect(resources[0].parent).toBe('FinancialProduct')
      expect(result.conflicts).toHaveLength(0)
    })

    it('single-source value does not produce a conflict', () => {
      const result = merge([
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan', description: 'Consumer loan' }] }, 'a', T1),
      ])
      const resources = result.dna.resources as Array<Record<string, unknown>>
      expect(resources[0].description).toBe('Consumer loan')
      expect(result.conflicts).toHaveLength(0)
    })

    it('conflicting required flags produce a conflict; recency tie-break wins', () => {
      const result = merge([
        chunk(
          { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number', required: true }] }] },
          'gdrive://abc',
          T1,
        ),
        chunk(
          { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number', required: false }] }] },
          'gdrive://def',
          T2,
        ),
      ])
      const resources = result.dna.resources as Array<Record<string, unknown>>
      const attrs = resources[0].attributes as Array<Record<string, unknown>>
      expect(attrs[0].required).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      const c = result.conflicts[0]
      expect(c.path).toBe('resources.Loan.attributes.amount.required')
      expect(c.values).toHaveLength(2)
      expect(c.recommendation.value).toBe(false)
      expect(c.recommendation.reason).toMatch(/most-recent/)
    })

    it('most-sources beats recency', () => {
      const result = merge([
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan', description: 'short' }] }, 'a', T1),
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan', description: 'short' }] }, 'b', T1),
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan', description: 'lots and lots of detail' }] }, 'c', T3),
      ])
      const resources = result.dna.resources as Array<Record<string, unknown>>
      expect(resources[0].description).toBe('short')
      const c = result.conflicts.find((x) => x.path.endsWith('description'))!
      expect(c.recommendation.reason).toMatch(/most-sources/)
    })
  })

  describe('cross-reference resolution', () => {
    it('Operation.target resolves against merged Resources without warning', () => {
      const result = merge([
        { domain: { name: 'd' }, resources: [{ name: 'Loan' }] },
        { domain: { name: 'd' }, operations: [{ name: 'Loan.Approve', target: 'Loan', action: 'Approve' }] },
      ])
      expect(result.conflicts.filter((c) => c.kind === 'unresolved-reference')).toHaveLength(0)
      expect(result.dna.operations).toHaveLength(1)
    })

    it('unresolved Operation.target produces a warning but the Operation is still emitted', () => {
      const result = merge([
        {
          domain: { name: 'd' },
          operations: [{ name: 'Mortgage.Approve', target: 'Mortgage', action: 'Approve' }],
        },
      ])
      const warnings = result.conflicts.filter((c) => c.kind === 'unresolved-reference')
      expect(warnings).toHaveLength(1)
      expect(warnings[0].path).toBe('operations.Mortgage.Approve.target')
      expect(result.dna.operations).toHaveLength(1)
    })

    it('reports unresolved Step.task references against the merged task set', () => {
      const result = merge([
        {
          domain: { name: 'd' },
          processes: [
            {
              name: 'P',
              operator: 'Underwriter',
              startStep: 's1',
              steps: [{ id: 's1', task: 'missing-task' }],
            },
          ],
        },
      ])
      const warnings = result.conflicts.filter((c) => c.kind === 'unresolved-reference')
      expect(warnings.some((w) => w.path === 'processes.P.steps.s1.task')).toBe(true)
    })
  })

  describe('provenance', () => {
    it('lists all contributing sources for a shared primitive', () => {
      const result = merge([
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan' }] }, 'file:///a.md', T1),
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan' }] }, 'gdrive://b', T2),
      ])
      const entries = result.provenance['resources.Loan']
      expect(entries).toBeDefined()
      const uris = entries.map((e) => e.uri).sort()
      expect(uris).toEqual(['file:///a.md', 'gdrive://b'])
    })

    it('per-attribute provenance is granular', () => {
      const result = merge([
        chunk(
          { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }] },
          'a',
          T1,
        ),
        chunk(
          { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] }] },
          'b',
          T2,
        ),
      ])
      const amount = result.provenance['resources.Loan.attributes.amount']
      const status = result.provenance['resources.Loan.attributes.status']
      expect(amount.map((s) => s.uri)).toEqual(['a'])
      expect(status.map((s) => s.uri)).toEqual(['b'])
    })

    it('does not embed provenance fields inside the merged DNA tree', () => {
      const result = merge([
        chunk({ domain: { name: 'd' }, resources: [{ name: 'Loan' }] }, 'a', T1),
      ])
      const json = JSON.stringify(result.dna)
      expect(json.includes('_provenance')).toBe(false)
      expect(json.includes('_source')).toBe(false)
    })
  })

  describe('schema validation regression', () => {
    it('a non-trivial merged DNA validates against the Operational schema', () => {
      // Stamp the base contract directly on each primitive so the merged
      // output validates. Use a fixed id on the Loan resource so both
      // chunks land on the same identity.
      const LOAN_ID = '11111111-1111-4111-8111-111111111111'
      const baseR = (extra: Record<string, unknown>) => ({
        id: LOAN_ID, type: 'resource', version: '1', ...extra,
      })
      const stamp = (type: string, p: Record<string, unknown>) => ({
        id: '22222222-2222-4222-8222-222222222222', type, version: '1', ...p,
      })
      const a: OperationalDNA = {
        domain: { name: 'acme', path: 'acme' },
        positions: [stamp('position', { name: 'Underwriter' })],
        resources: [
          baseR({
            name: 'Loan',
            attributes: [
              { name: 'amount', type: 'number', required: true },
              { name: 'status', type: 'enum', values: ['pending', 'active'] },
            ],
            actions: [{ name: 'Approve', type: 'write' }],
          }),
        ],
        persons: [stamp('person', { name: 'Employee' })],
        operations: [stamp('operation', { name: 'Loan.Approve', target: 'Loan', action: 'Approve' })],
      }
      const b: OperationalDNA = {
        domain: { name: 'acme',
          path: 'acme' }, resources: [
            baseR({
              name: 'Loan',
              attributes: [{ name: 'borrower', type: 'reference' }],
            }),
          ],
      }
      const result = merge([chunk(a, 'a', T1), chunk(b, 'b', T2)])
      const validator = new DnaValidator()
      const validation = validator.validate(result.dna, 'operational')
      expect(validation.valid).toBe(true)
    })
  })
})
