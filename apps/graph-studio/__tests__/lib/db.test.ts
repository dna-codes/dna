const mockCreateClient = jest.fn().mockReturnValue({ mock: 'dnaDataStore' })

jest.mock('@dna-codes/dna-adapters/integration/neo4j', () => ({
  createClient: mockCreateClient,
}))

describe('getDb', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    mockCreateClient.mockClear()
  })

  afterEach(() => {
    process.env = OLD_ENV
    jest.resetModules()
  })

  it('returns null when NEO4J_URI is unset', async () => {
    delete process.env.NEO4J_URI
    const { getDb } = await import('../../lib/db')
    expect(getDb()).toBeNull()
  })

  it('returns null when NEO4J_USERNAME is unset', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687'
    delete process.env.NEO4J_USERNAME
    const { getDb } = await import('../../lib/db')
    expect(getDb()).toBeNull()
  })

  it('returns null when NEO4J_PASSWORD is unset', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687'
    process.env.NEO4J_USERNAME = 'neo4j'
    delete process.env.NEO4J_PASSWORD
    const { getDb } = await import('../../lib/db')
    expect(getDb()).toBeNull()
  })

  it('returns a DnaDataStore when all env vars are set', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687'
    process.env.NEO4J_USERNAME = 'neo4j'
    process.env.NEO4J_PASSWORD = 'password'
    const { getDb } = await import('../../lib/db')
    const db = getDb()
    expect(db).not.toBeNull()
    expect(mockCreateClient).toHaveBeenCalledWith(
      { uri: 'bolt://localhost:7687', username: 'neo4j', password: 'password' },
      expect.anything()
    )
  })
})
