/**
 * Live Neo4j integration tests. Gated on the `NEO4J_URI` environment
 * variable — when unset (the default), every test in this file is
 * skipped so unit-test runs (CI, pre-commit) succeed without a database.
 *
 * Run against a real instance with:
 *
 *   NEO4J_URI=bolt://localhost:7687 \
 *   NEO4J_USERNAME=neo4j \
 *   NEO4J_PASSWORD=test \
 *   npm test --workspace @dna-codes/dna-adapters -- --testPathPattern neo4j
 *
 * Tests use a unique database namespace per run via the `_dnaId` /
 * `_testRunId` pattern — every Instance and TypeDefinition they create
 * is tagged so a failing run can be cleaned up by hand without affecting
 * concurrent work in the same instance.
 */
export {};
//# sourceMappingURL=index.test.d.ts.map