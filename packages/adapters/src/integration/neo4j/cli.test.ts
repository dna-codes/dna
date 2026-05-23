import { runCli } from './cli'

describe('integration/neo4j CLI env-var handling', () => {
  it('exits non-zero with a clear message when NEO4J_URI is unset', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const code = await runCli(['migrate', '--dna', 'nonexistent.json'], {
        NEO4J_USERNAME: 'u',
        NEO4J_PASSWORD: 'p',
      })
      expect(code).not.toBe(0)
      const messages = errSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(messages).toMatch(/NEO4J_URI/)
    } finally {
      errSpy.mockRestore()
    }
  })

  it('exits 0 on help command', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    try {
      const code = await runCli(['help'], {})
      expect(code).toBe(0)
      const messages = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(messages).toMatch(/integration-neo4j/)
    } finally {
      logSpy.mockRestore()
    }
  })

  it('exits 64 on unknown command', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    try {
      const code = await runCli(['something-bogus'], {
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_USERNAME: 'u',
        NEO4J_PASSWORD: 'p',
      })
      expect(code).toBe(64)
    } finally {
      errSpy.mockRestore()
      logSpy.mockRestore()
    }
  })
})
