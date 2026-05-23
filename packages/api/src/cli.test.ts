import { runCli } from './cli'

describe('cli', () => {
  it('help prints usage and exits 0', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    try {
      const code = await runCli(['help'], {})
      expect(code).toBe(0)
      const out = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(out).toMatch(/dna-api/)
      expect(out).toMatch(/serve/)
      expect(out).toMatch(/--dna/)
      expect(out).toMatch(/DNA_FILE/)
      expect(out).toMatch(/NEO4J_URI/)
    } finally {
      logSpy.mockRestore()
    }
  })

  it('unknown command exits 64', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const code = await runCli(['something-bogus'], {
        DNA_FILE: '/tmp/x.json',
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_USERNAME: 'u',
        NEO4J_PASSWORD: 'p',
      })
      expect(code).toBe(64)
    } finally {
      logSpy.mockRestore()
      errSpy.mockRestore()
    }
  })

  it('serve exits non-zero when DNA source is unset', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const code = await runCli(['serve'], {
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_USERNAME: 'u',
        NEO4J_PASSWORD: 'p',
      })
      expect(code).not.toBe(0)
      const msg = errSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(msg).toMatch(/--dna/)
      expect(msg).toMatch(/DNA_FILE/)
    } finally {
      errSpy.mockRestore()
    }
  })

  it('serve exits non-zero when NEO4J_URI is unset', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const code = await runCli(['serve', '--dna', '/tmp/never.json'], {})
      expect(code).not.toBe(0)
      const msg = errSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(msg).toMatch(/NEO4J_URI/)
    } finally {
      errSpy.mockRestore()
    }
  })
})
