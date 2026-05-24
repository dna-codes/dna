import {
  buildLinkListCypher,
  COUNT_INSTANCES_OF_TYPE_CYPHER,
  COUNT_LINKS_OF_ROLE_CYPHER,
  CREATE_RELATIONSHIP_TYPE_CYPHER,
  CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER,
  CREATE_RESOURCE_TYPE_CYPHER,
  CREATE_RESOURCE_TYPE_VERSION_CYPHER,
  DELETE_LINK_CYPHER,
  DELETE_LINKS_OF_ROLE_CYPHER,
  DELETE_RELATIONSHIP_TYPE_CYPHER,
  DELETE_RESOURCE_TYPE_CYPHER,
  GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER,
  GET_RELATIONSHIP_TYPE_CYPHER,
  GET_RESOURCE_TYPE_BY_NAME_CYPHER,
  GET_RESOURCE_TYPE_CYPHER,
  HAS_SEED_MARKER_CYPHER,
  LIST_RELATIONSHIP_TYPES_CYPHER,
  LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER,
  LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER,
  LIST_RESOURCE_TYPES_CYPHER,
  LIST_RESOURCE_TYPE_VERSIONS_CYPHER,
  METADATA_SCHEMA_CYPHER,
  UPDATE_RELATIONSHIP_TYPE_CYPHER,
  UPDATE_RESOURCE_TYPE_CYPHER,
  WRITE_SEED_MARKER_CYPHER,
  createInstanceCypher,
  createLinkCypher,
  deleteInstanceCypher,
  dropLabelSchemaCypher,
  getInstanceCypher,
  labelSchemaCypher,
  listInstanceCypher,
  updateInstanceCypher,
  validateLabel,
} from './cypher'

describe('cypher/validateLabel', () => {
  it('accepts PascalCase identifiers', () => {
    expect(() => validateLabel('Loan')).not.toThrow()
    expect(() => validateLabel('ResourceType')).not.toThrow()
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

describe('cypher/metadata schema (registry-native)', () => {
  it('METADATA_SCHEMA_CYPHER covers ResourceType, RelationshipType, version nodes, LINK._id', () => {
    const joined = METADATA_SCHEMA_CYPHER.join('\n')
    expect(joined).toMatch(/CONSTRAINT.*ResourceType.*name/i)
    expect(joined).toMatch(/CONSTRAINT.*RelationshipType.*name/i)
    expect(joined).toMatch(/CONSTRAINT.*ResourceTypeVersion.*id/i)
    expect(joined).toMatch(/CONSTRAINT.*RelationshipTypeVersion.*id/i)
    expect(joined).toMatch(/INDEX.*LINK.*_id/i)
  })

  it('TypeDefinition and RelationshipDef labels are NOT created (renamed)', () => {
    const joined = METADATA_SCHEMA_CYPHER.join('\n')
    expect(joined).not.toMatch(/TypeDefinition/)
    expect(joined).not.toMatch(/RelationshipDef/)
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

  it('dropLabelSchemaCypher emits DROP statements for the same artifacts', () => {
    const [dropConstraint, dropIndex] = dropLabelSchemaCypher('Loan')
    expect(dropConstraint).toMatch(/DROP CONSTRAINT.*loan_id_unique/i)
    expect(dropIndex).toMatch(/DROP INDEX.*loan_typename_index/i)
  })

  it('rejects an unsafe label', () => {
    expect(() => labelSchemaCypher('Loan; DROP')).toThrow(/invalid typeName/)
    expect(() => dropLabelSchemaCypher('Loan; DROP')).toThrow(/invalid typeName/)
  })
})

describe('cypher/ResourceType + RelationshipType CRUD', () => {
  it('CREATE_RESOURCE_TYPE_CYPHER writes a labeled node from $props', () => {
    expect(CREATE_RESOURCE_TYPE_CYPHER).toContain('(rt:ResourceType')
    expect(CREATE_RESOURCE_TYPE_CYPHER).toContain('$props')
    expect(CREATE_RESOURCE_TYPE_CYPHER).toContain('RETURN rt.id AS id')
  })

  it('CREATE_RESOURCE_TYPE_VERSION_CYPHER links to the live type via VERSION_OF', () => {
    expect(CREATE_RESOURCE_TYPE_VERSION_CYPHER).toContain('(rt:ResourceType {id: $resourceTypeId})')
    expect(CREATE_RESOURCE_TYPE_VERSION_CYPHER).toContain('(v:ResourceTypeVersion')
    expect(CREATE_RESOURCE_TYPE_VERSION_CYPHER).toContain('[:VERSION_OF]')
  })

  it('UPDATE_RESOURCE_TYPE_CYPHER bumps current_version', () => {
    expect(UPDATE_RESOURCE_TYPE_CYPHER).toContain('SET rt += $patch, rt.current_version = $newVersion')
  })

  it('DELETE_RESOURCE_TYPE_CYPHER cleans up versions via DETACH DELETE', () => {
    expect(DELETE_RESOURCE_TYPE_CYPHER).toContain('DETACH DELETE v, rt')
  })

  it('GET_RESOURCE_TYPE_CYPHER and GET_RESOURCE_TYPE_BY_NAME_CYPHER both target :ResourceType', () => {
    expect(GET_RESOURCE_TYPE_CYPHER).toContain('(rt:ResourceType {id: $id})')
    expect(GET_RESOURCE_TYPE_BY_NAME_CYPHER).toContain('(rt:ResourceType {name: $name})')
  })

  it('LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER filters by category', () => {
    expect(LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER).toContain('(rt:ResourceType {category: $category})')
  })

  it('LIST_RESOURCE_TYPES_CYPHER returns all in name order', () => {
    expect(LIST_RESOURCE_TYPES_CYPHER).toContain('(rt:ResourceType)')
    expect(LIST_RESOURCE_TYPES_CYPHER).toContain('ORDER BY rt.name')
  })

  it('LIST_RESOURCE_TYPE_VERSIONS_CYPHER returns versions in descending order', () => {
    expect(LIST_RESOURCE_TYPE_VERSIONS_CYPHER).toContain('ORDER BY v.version DESC')
  })

  it('RelationshipType mirror exists', () => {
    expect(CREATE_RELATIONSHIP_TYPE_CYPHER).toContain('(rt:RelationshipType')
    expect(CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER).toContain('(v:RelationshipTypeVersion')
    expect(UPDATE_RELATIONSHIP_TYPE_CYPHER).toContain('SET rt += $patch, rt.current_version = $newVersion')
    expect(DELETE_RELATIONSHIP_TYPE_CYPHER).toContain('DETACH DELETE v, rt')
    expect(GET_RELATIONSHIP_TYPE_CYPHER).toContain('(rt:RelationshipType {id: $id})')
    expect(GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER).toContain('(rt:RelationshipType {name: $name})')
    expect(LIST_RELATIONSHIP_TYPES_CYPHER).toContain('(rt:RelationshipType)')
    expect(LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER).toContain('(rt:RelationshipType {id: $id})')
  })

  it('COUNT_INSTANCES_OF_TYPE_CYPHER is per-label and rejects unsafe labels', () => {
    expect(COUNT_INSTANCES_OF_TYPE_CYPHER('Loan')).toBe('MATCH (n:Loan) RETURN count(n) AS count')
    expect(() => COUNT_INSTANCES_OF_TYPE_CYPHER('Loan; DROP')).toThrow()
  })

  it('COUNT_LINKS_OF_ROLE_CYPHER filters by role property', () => {
    expect(COUNT_LINKS_OF_ROLE_CYPHER).toContain('[r:LINK {role: $role}]')
    expect(COUNT_LINKS_OF_ROLE_CYPHER).toContain('count(r) AS count')
  })

  it('DELETE_LINKS_OF_ROLE_CYPHER deletes by role', () => {
    expect(DELETE_LINKS_OF_ROLE_CYPHER).toContain('[r:LINK {role: $role}]')
    expect(DELETE_LINKS_OF_ROLE_CYPHER).toContain('DELETE r')
  })
})

describe('cypher/seed marker', () => {
  it('HAS_SEED_MARKER_CYPHER queries a :SeedMarker node', () => {
    expect(HAS_SEED_MARKER_CYPHER).toContain('(m:SeedMarker)')
    expect(HAS_SEED_MARKER_CYPHER).toContain('LIMIT 1')
  })

  it('WRITE_SEED_MARKER_CYPHER MERGEs the marker with createdAt + dnaHash', () => {
    expect(WRITE_SEED_MARKER_CYPHER).toContain('MERGE (m:SeedMarker)')
    expect(WRITE_SEED_MARKER_CYPHER).toContain('m.createdAt = $createdAt')
    expect(WRITE_SEED_MARKER_CYPHER).toContain('m.dnaHash = $dnaHash')
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

  it('combined filter parameterizes from, to, and role', () => {
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
