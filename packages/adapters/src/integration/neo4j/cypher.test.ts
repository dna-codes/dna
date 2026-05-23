import {
  buildLinkListCypher,
  createInstanceCypher,
  createLinkCypher,
  DELETE_LINK_CYPHER,
  deleteInstanceCypher,
  getInstanceCypher,
  labelSchemaCypher,
  listInstanceCypher,
  MERGE_RELDEF_CYPHER,
  MERGE_TYPEDEF_CYPHER,
  METADATA_SCHEMA_CYPHER,
  updateInstanceCypher,
  validateLabel,
} from './cypher'

describe('cypher/validateLabel', () => {
  it('accepts PascalCase identifiers', () => {
    expect(() => validateLabel('Loan')).not.toThrow()
    expect(() => validateLabel('TypeDefinition')).not.toThrow()
    expect(() => validateLabel('Borrower2')).not.toThrow()
  })

  it('rejects unsafe / non-PascalCase labels', () => {
    expect(() => validateLabel('loan')).toThrow(/invalid typeName/)
    expect(() => validateLabel('Loan; DROP')).toThrow(/invalid typeName/)
    expect(() => validateLabel('')).toThrow(/invalid typeName/)
    expect(() => validateLabel('1Loan')).toThrow(/invalid typeName/)
    expect(() => validateLabel('Loan-2')).toThrow(/invalid typeName/)
  })
})

describe('cypher/metadata schema', () => {
  it('METADATA_SCHEMA_CYPHER covers TypeDefinition, RelationshipDef, and LINK._id', () => {
    const joined = METADATA_SCHEMA_CYPHER.join('\n')
    expect(joined).toMatch(/CONSTRAINT.*TypeDefinition.*name/i)
    expect(joined).toMatch(/CONSTRAINT.*RelationshipDef.*name/i)
    expect(joined).toMatch(/INDEX.*LINK.*_id/i)
  })

  it('all metadata statements use IF NOT EXISTS for idempotency', () => {
    for (const stmt of METADATA_SCHEMA_CYPHER) {
      expect(stmt).toMatch(/IF NOT EXISTS/)
    }
  })
})

describe('cypher/labelSchemaCypher', () => {
  it('emits a _id uniqueness constraint and a _typeName index per label', () => {
    const [constraint, index] = labelSchemaCypher('Loan')
    expect(constraint).toMatch(/CONSTRAINT.*Loan.*_id IS UNIQUE/i)
    expect(constraint).toMatch(/IF NOT EXISTS/)
    expect(index).toMatch(/INDEX.*Loan.*_typeName/i)
    expect(index).toMatch(/IF NOT EXISTS/)
  })

  it('rejects an unsafe label', () => {
    expect(() => labelSchemaCypher('Loan; DROP')).toThrow(/invalid typeName/)
  })
})

describe('cypher/Instance CRUD', () => {
  it('createInstanceCypher interpolates the label and parameterizes props', () => {
    const cypher = createInstanceCypher('Loan')
    expect(cypher).toContain('(n:Loan)')
    expect(cypher).toContain('$props')
    expect(cypher).toContain('RETURN n._id AS id')
  })

  it('getInstanceCypher matches by _id parameter', () => {
    const cypher = getInstanceCypher('Borrower')
    expect(cypher).toMatch(/MATCH \(n:Borrower \{_id: \$id\}\) RETURN n/)
  })

  it('updateInstanceCypher uses += for partial merge and stamps _updatedAt', () => {
    const cypher = updateInstanceCypher('Loan')
    expect(cypher).toContain('SET n += $patch')
    expect(cypher).toContain('n._updatedAt = $updatedAt')
  })

  it('deleteInstanceCypher uses DETACH DELETE so edges are cleaned up', () => {
    const cypher = deleteInstanceCypher('Loan')
    expect(cypher).toContain('DETACH DELETE n')
  })

  it('listInstanceCypher returns nodes by label', () => {
    const cypher = listInstanceCypher('Loan')
    expect(cypher).toMatch(/MATCH \(n:Loan\) RETURN n/)
  })

  it('every Instance CRUD function rejects an unsafe label', () => {
    const bad = 'Loan; DROP'
    expect(() => createInstanceCypher(bad)).toThrow()
    expect(() => getInstanceCypher(bad)).toThrow()
    expect(() => updateInstanceCypher(bad)).toThrow()
    expect(() => deleteInstanceCypher(bad)).toThrow()
    expect(() => listInstanceCypher(bad)).toThrow()
  })
})

describe('cypher/Link', () => {
  it('createLinkCypher matches both endpoints and creates a LINK edge', () => {
    const cypher = createLinkCypher('Loan', 'Borrower')
    expect(cypher).toContain('(a:Loan {_id: $fromId})')
    expect(cypher).toContain('(b:Borrower {_id: $toId})')
    expect(cypher).toContain('CREATE (a)-[r:LINK]->(b)')
    expect(cypher).toContain('SET r = $props')
  })

  it('DELETE_LINK_CYPHER deletes by edge _id', () => {
    expect(DELETE_LINK_CYPHER).toContain('[r:LINK {_id: $linkId}]')
    expect(DELETE_LINK_CYPHER).toContain('DELETE r')
  })

  it('createLinkCypher rejects unsafe labels', () => {
    expect(() => createLinkCypher('Loan; DROP', 'Borrower')).toThrow()
    expect(() => createLinkCypher('Loan', 'Borrower; DROP')).toThrow()
  })
})

describe('cypher/buildLinkListCypher', () => {
  it('no filter produces an unconstrained scan', () => {
    const { cypher, params } = buildLinkListCypher({})
    expect(cypher).toMatch(/MATCH \(a\)-\[r:LINK\]->\(b\)\s+RETURN/)
    expect(cypher).not.toMatch(/WHERE/)
    expect(params).toEqual({})
  })

  it('from filter pins the source label and parameterizes fromId', () => {
    const { cypher, params } = buildLinkListCypher({
      from: { typeName: 'Loan', id: 'l1' },
    })
    expect(cypher).toContain('(a:Loan {_id: $fromId})')
    expect(params).toEqual({ fromId: 'l1' })
  })

  it('to filter pins the target label and parameterizes toId', () => {
    const { cypher, params } = buildLinkListCypher({
      to: { typeName: 'Borrower', id: 'b1' },
    })
    expect(cypher).toContain('(b:Borrower {_id: $toId})')
    expect(params).toEqual({ toId: 'b1' })
  })

  it('role filter adds a WHERE clause and parameterizes role', () => {
    const { cypher, params } = buildLinkListCypher({ role: 'primary_borrower' })
    expect(cypher).toContain('WHERE r.role = $role')
    expect(params).toEqual({ role: 'primary_borrower' })
  })

  it('combined filter parameterizes all three', () => {
    const { cypher, params } = buildLinkListCypher({
      from: { typeName: 'Loan', id: 'l1' },
      to: { typeName: 'Borrower', id: 'b1' },
      role: 'primary_borrower',
    })
    expect(cypher).toContain('(a:Loan {_id: $fromId})')
    expect(cypher).toContain('(b:Borrower {_id: $toId})')
    expect(cypher).toContain('WHERE r.role = $role')
    expect(params).toEqual({
      fromId: 'l1',
      toId: 'b1',
      role: 'primary_borrower',
    })
  })

  it('rejects unsafe labels in either endpoint', () => {
    expect(() => buildLinkListCypher({ from: { typeName: 'Loan; DROP', id: 'l1' } })).toThrow()
    expect(() => buildLinkListCypher({ to: { typeName: 'Loan; DROP', id: 'l1' } })).toThrow()
  })
})

describe('cypher/metadata MERGE', () => {
  it('MERGE_TYPEDEF_CYPHER merges on name and assigns props', () => {
    expect(MERGE_TYPEDEF_CYPHER).toContain('MERGE (n:TypeDefinition {name: $name})')
    expect(MERGE_TYPEDEF_CYPHER).toContain('SET n += $props')
  })

  it('MERGE_RELDEF_CYPHER merges on name and assigns props', () => {
    expect(MERGE_RELDEF_CYPHER).toContain('MERGE (n:RelationshipDef {name: $name})')
    expect(MERGE_RELDEF_CYPHER).toContain('SET n += $props')
  })
})
