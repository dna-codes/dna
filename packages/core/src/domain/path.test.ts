import { derivePath } from './path'

const domains = [
  { name: 'acme' },
  { name: 'finance', parent: 'acme' },
  { name: 'lending', parent: 'finance', path: 'WRONG.STALE.PATH' },
]

describe('derivePath', () => {
  it('returns the name alone for the rootless tenant', () => {
    expect(derivePath('acme', domains)).toBe('acme')
  })

  it('walks the parent chain root→leaf', () => {
    expect(derivePath('finance', domains)).toBe('acme.finance')
    expect(derivePath('lending', domains)).toBe('acme.finance.lending')
  })

  it('ignores any authored (stale) path and follows the chain', () => {
    // `lending` carries path "WRONG.STALE.PATH"; the parent chain governs.
    expect(derivePath('lending', domains)).toBe('acme.finance.lending')
  })

  it('returns empty string for an unknown domain', () => {
    expect(derivePath('nope', domains)).toBe('')
  })

  it('terminates on a cycle, returning a best-effort path', () => {
    const cyclic = [
      { name: 'a', parent: 'b' },
      { name: 'b', parent: 'a' },
    ]
    // Either order is acceptable as long as it terminates and includes both.
    const p = derivePath('a', cyclic)
    expect(p.split('.').sort()).toEqual(['a', 'b'])
  })

  it('stops at a parent that names a missing domain', () => {
    const orphan = [{ name: 'lending', parent: 'ghost' }]
    expect(derivePath('lending', orphan)).toBe('lending')
  })
})
