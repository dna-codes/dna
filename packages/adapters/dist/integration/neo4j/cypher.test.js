"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cypher_1 = require("./cypher");
describe('cypher/validateLabel', () => {
    it('accepts PascalCase identifiers', () => {
        expect(() => (0, cypher_1.validateLabel)('Loan')).not.toThrow();
        expect(() => (0, cypher_1.validateLabel)('ResourceType')).not.toThrow();
        expect(() => (0, cypher_1.validateLabel)('Borrower2')).not.toThrow();
    });
    it('rejects unsafe / non-PascalCase labels', () => {
        expect(() => (0, cypher_1.validateLabel)('loan')).toThrow(/invalid typeName/);
        expect(() => (0, cypher_1.validateLabel)('Loan; DROP')).toThrow(/invalid typeName/);
        expect(() => (0, cypher_1.validateLabel)('')).toThrow(/invalid typeName/);
        expect(() => (0, cypher_1.validateLabel)('1Loan')).toThrow(/invalid typeName/);
        expect(() => (0, cypher_1.validateLabel)('Loan-2')).toThrow(/invalid typeName/);
    });
});
describe('cypher/metadata schema (registry-native)', () => {
    it('METADATA_SCHEMA_CYPHER covers ResourceType, RelationshipType, version nodes, LINK._id', () => {
        const joined = cypher_1.METADATA_SCHEMA_CYPHER.join('\n');
        expect(joined).toMatch(/CONSTRAINT.*ResourceType.*name/i);
        expect(joined).toMatch(/CONSTRAINT.*RelationshipType.*name/i);
        expect(joined).toMatch(/CONSTRAINT.*ResourceTypeVersion.*id/i);
        expect(joined).toMatch(/CONSTRAINT.*RelationshipTypeVersion.*id/i);
        expect(joined).toMatch(/INDEX.*LINK.*_id/i);
    });
    it('TypeDefinition and RelationshipDef labels are NOT created (renamed)', () => {
        const joined = cypher_1.METADATA_SCHEMA_CYPHER.join('\n');
        expect(joined).not.toMatch(/TypeDefinition/);
        expect(joined).not.toMatch(/RelationshipDef/);
    });
    it('all metadata statements use IF NOT EXISTS for idempotency', () => {
        for (const stmt of cypher_1.METADATA_SCHEMA_CYPHER) {
            expect(stmt).toMatch(/IF NOT EXISTS/);
        }
    });
});
describe('cypher/labelSchemaCypher', () => {
    it('emits a _id uniqueness constraint and a _typeName index per label', () => {
        const [constraint, index] = (0, cypher_1.labelSchemaCypher)('Loan');
        expect(constraint).toMatch(/CONSTRAINT.*Loan.*_id IS UNIQUE/i);
        expect(constraint).toMatch(/IF NOT EXISTS/);
        expect(index).toMatch(/INDEX.*Loan.*_typeName/i);
        expect(index).toMatch(/IF NOT EXISTS/);
    });
    it('dropLabelSchemaCypher emits DROP statements for the same artifacts', () => {
        const [dropConstraint, dropIndex] = (0, cypher_1.dropLabelSchemaCypher)('Loan');
        expect(dropConstraint).toMatch(/DROP CONSTRAINT.*loan_id_unique/i);
        expect(dropIndex).toMatch(/DROP INDEX.*loan_typename_index/i);
    });
    it('rejects an unsafe label', () => {
        expect(() => (0, cypher_1.labelSchemaCypher)('Loan; DROP')).toThrow(/invalid typeName/);
        expect(() => (0, cypher_1.dropLabelSchemaCypher)('Loan; DROP')).toThrow(/invalid typeName/);
    });
});
describe('cypher/ResourceType + RelationshipType CRUD', () => {
    it('CREATE_RESOURCE_TYPE_CYPHER writes a labeled node from $props', () => {
        expect(cypher_1.CREATE_RESOURCE_TYPE_CYPHER).toContain('(rt:ResourceType');
        expect(cypher_1.CREATE_RESOURCE_TYPE_CYPHER).toContain('$props');
        expect(cypher_1.CREATE_RESOURCE_TYPE_CYPHER).toContain('RETURN rt.id AS id');
    });
    it('CREATE_RESOURCE_TYPE_VERSION_CYPHER links to the live type via VERSION_OF', () => {
        expect(cypher_1.CREATE_RESOURCE_TYPE_VERSION_CYPHER).toContain('(rt:ResourceType {id: $resourceTypeId})');
        expect(cypher_1.CREATE_RESOURCE_TYPE_VERSION_CYPHER).toContain('(v:ResourceTypeVersion');
        expect(cypher_1.CREATE_RESOURCE_TYPE_VERSION_CYPHER).toContain('[:VERSION_OF]');
    });
    it('UPDATE_RESOURCE_TYPE_CYPHER bumps current_version', () => {
        expect(cypher_1.UPDATE_RESOURCE_TYPE_CYPHER).toContain('SET rt += $patch, rt.current_version = $newVersion');
    });
    it('DELETE_RESOURCE_TYPE_CYPHER cleans up versions via DETACH DELETE', () => {
        expect(cypher_1.DELETE_RESOURCE_TYPE_CYPHER).toContain('DETACH DELETE v, rt');
    });
    it('GET_RESOURCE_TYPE_CYPHER and GET_RESOURCE_TYPE_BY_NAME_CYPHER both target :ResourceType', () => {
        expect(cypher_1.GET_RESOURCE_TYPE_CYPHER).toContain('(rt:ResourceType {id: $id})');
        expect(cypher_1.GET_RESOURCE_TYPE_BY_NAME_CYPHER).toContain('(rt:ResourceType {name: $name})');
    });
    it('LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER filters by category', () => {
        expect(cypher_1.LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER).toContain('(rt:ResourceType {category: $category})');
    });
    it('LIST_RESOURCE_TYPES_CYPHER returns all in name order', () => {
        expect(cypher_1.LIST_RESOURCE_TYPES_CYPHER).toContain('(rt:ResourceType)');
        expect(cypher_1.LIST_RESOURCE_TYPES_CYPHER).toContain('ORDER BY rt.name');
    });
    it('LIST_RESOURCE_TYPE_VERSIONS_CYPHER returns versions in descending order', () => {
        expect(cypher_1.LIST_RESOURCE_TYPE_VERSIONS_CYPHER).toContain('ORDER BY v.version DESC');
    });
    it('RelationshipType mirror exists', () => {
        expect(cypher_1.CREATE_RELATIONSHIP_TYPE_CYPHER).toContain('(rt:RelationshipType');
        expect(cypher_1.CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER).toContain('(v:RelationshipTypeVersion');
        expect(cypher_1.UPDATE_RELATIONSHIP_TYPE_CYPHER).toContain('SET rt += $patch, rt.current_version = $newVersion');
        expect(cypher_1.DELETE_RELATIONSHIP_TYPE_CYPHER).toContain('DETACH DELETE v, rt');
        expect(cypher_1.GET_RELATIONSHIP_TYPE_CYPHER).toContain('(rt:RelationshipType {id: $id})');
        expect(cypher_1.GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER).toContain('(rt:RelationshipType {name: $name})');
        expect(cypher_1.LIST_RELATIONSHIP_TYPES_CYPHER).toContain('(rt:RelationshipType)');
        expect(cypher_1.LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER).toContain('(rt:RelationshipType {id: $id})');
    });
    it('COUNT_INSTANCES_OF_TYPE_CYPHER is per-label and rejects unsafe labels', () => {
        expect((0, cypher_1.COUNT_INSTANCES_OF_TYPE_CYPHER)('Loan')).toBe('MATCH (n:Loan) RETURN count(n) AS count');
        expect(() => (0, cypher_1.COUNT_INSTANCES_OF_TYPE_CYPHER)('Loan; DROP')).toThrow();
    });
    it('COUNT_LINKS_OF_ROLE_CYPHER filters by role property', () => {
        expect(cypher_1.COUNT_LINKS_OF_ROLE_CYPHER).toContain('[r:LINK {role: $role}]');
        expect(cypher_1.COUNT_LINKS_OF_ROLE_CYPHER).toContain('count(r) AS count');
    });
    it('DELETE_LINKS_OF_ROLE_CYPHER deletes by role', () => {
        expect(cypher_1.DELETE_LINKS_OF_ROLE_CYPHER).toContain('[r:LINK {role: $role}]');
        expect(cypher_1.DELETE_LINKS_OF_ROLE_CYPHER).toContain('DELETE r');
    });
});
describe('cypher/seed marker', () => {
    it('HAS_SEED_MARKER_CYPHER queries a :SeedMarker node', () => {
        expect(cypher_1.HAS_SEED_MARKER_CYPHER).toContain('(m:SeedMarker)');
        expect(cypher_1.HAS_SEED_MARKER_CYPHER).toContain('LIMIT 1');
    });
    it('WRITE_SEED_MARKER_CYPHER MERGEs the marker with createdAt + dnaHash', () => {
        expect(cypher_1.WRITE_SEED_MARKER_CYPHER).toContain('MERGE (m:SeedMarker)');
        expect(cypher_1.WRITE_SEED_MARKER_CYPHER).toContain('m.createdAt = $createdAt');
        expect(cypher_1.WRITE_SEED_MARKER_CYPHER).toContain('m.dnaHash = $dnaHash');
    });
});
describe('cypher/Instance CRUD', () => {
    it('createInstanceCypher interpolates the label and parameterizes props', () => {
        const cypher = (0, cypher_1.createInstanceCypher)('Loan');
        expect(cypher).toContain('(n:Loan)');
        expect(cypher).toContain('$props');
        expect(cypher).toContain('RETURN n._id AS id');
    });
    it('getInstanceCypher matches by _id parameter', () => {
        const cypher = (0, cypher_1.getInstanceCypher)('Borrower');
        expect(cypher).toMatch(/MATCH \(n:Borrower \{_id: \$id\}\) RETURN n/);
    });
    it('updateInstanceCypher uses += for partial merge and stamps _updatedAt', () => {
        const cypher = (0, cypher_1.updateInstanceCypher)('Loan');
        expect(cypher).toContain('SET n += $patch');
        expect(cypher).toContain('n._updatedAt = $updatedAt');
    });
    it('deleteInstanceCypher uses DETACH DELETE so edges are cleaned up', () => {
        const cypher = (0, cypher_1.deleteInstanceCypher)('Loan');
        expect(cypher).toContain('DETACH DELETE n');
    });
    it('listInstanceCypher returns nodes by label', () => {
        const cypher = (0, cypher_1.listInstanceCypher)('Loan');
        expect(cypher).toMatch(/MATCH \(n:Loan\) RETURN n/);
    });
    it('every Instance CRUD function rejects an unsafe label', () => {
        const bad = 'Loan; DROP';
        expect(() => (0, cypher_1.createInstanceCypher)(bad)).toThrow();
        expect(() => (0, cypher_1.getInstanceCypher)(bad)).toThrow();
        expect(() => (0, cypher_1.updateInstanceCypher)(bad)).toThrow();
        expect(() => (0, cypher_1.deleteInstanceCypher)(bad)).toThrow();
        expect(() => (0, cypher_1.listInstanceCypher)(bad)).toThrow();
    });
});
describe('cypher/Link', () => {
    it('createLinkCypher matches both endpoints and creates a LINK edge', () => {
        const cypher = (0, cypher_1.createLinkCypher)('Loan', 'Borrower');
        expect(cypher).toContain('(a:Loan {_id: $fromId})');
        expect(cypher).toContain('(b:Borrower {_id: $toId})');
        expect(cypher).toContain('CREATE (a)-[r:LINK]->(b)');
        expect(cypher).toContain('SET r = $props');
    });
    it('DELETE_LINK_CYPHER deletes by edge _id', () => {
        expect(cypher_1.DELETE_LINK_CYPHER).toContain('[r:LINK {_id: $linkId}]');
        expect(cypher_1.DELETE_LINK_CYPHER).toContain('DELETE r');
    });
    it('createLinkCypher rejects unsafe labels', () => {
        expect(() => (0, cypher_1.createLinkCypher)('Loan; DROP', 'Borrower')).toThrow();
        expect(() => (0, cypher_1.createLinkCypher)('Loan', 'Borrower; DROP')).toThrow();
    });
});
describe('cypher/buildLinkListCypher', () => {
    it('no filter produces an unconstrained scan', () => {
        const { cypher, params } = (0, cypher_1.buildLinkListCypher)({});
        expect(cypher).toMatch(/MATCH \(a\)-\[r:LINK\]->\(b\)\s+RETURN/);
        expect(cypher).not.toMatch(/WHERE/);
        expect(params).toEqual({});
    });
    it('combined filter parameterizes from, to, and role', () => {
        const { cypher, params } = (0, cypher_1.buildLinkListCypher)({
            from: { typeName: 'Loan', id: 'l1' },
            to: { typeName: 'Borrower', id: 'b1' },
            role: 'primary_borrower',
        });
        expect(cypher).toContain('(a:Loan {_id: $fromId})');
        expect(cypher).toContain('(b:Borrower {_id: $toId})');
        expect(cypher).toContain('WHERE r.role = $role');
        expect(params).toEqual({
            fromId: 'l1',
            toId: 'b1',
            role: 'primary_borrower',
        });
    });
    it('rejects unsafe labels in either endpoint', () => {
        expect(() => (0, cypher_1.buildLinkListCypher)({ from: { typeName: 'Loan; DROP', id: 'l1' } })).toThrow();
        expect(() => (0, cypher_1.buildLinkListCypher)({ to: { typeName: 'Loan; DROP', id: 'l1' } })).toThrow();
    });
});
//# sourceMappingURL=cypher.test.js.map