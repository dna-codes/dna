import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { ingest } from './ingest'
import type { Integration, InputAdapter, OperationalDNA } from './types'

const LLM = { model: 'test-model', temperature: 0, seed: 42 }

function makeAdapter(produce: () => OperationalDNA): jest.Mock & InputAdapter {
  const fn = jest.fn(async (_contents: string | Buffer, _opts) => produce()) as unknown as jest.Mock & InputAdapter
  return fn
}

describe('ingest()', () => {
  describe('URI-scheme dispatch', () => {
    let tmpDir: string

    beforeAll(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-ingest-e2e-'))
    })

    afterAll(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('handles file:// URIs without requiring an integration', async () => {
      const file = path.join(tmpDir, 'sop.md')
      fs.writeFileSync(file, '# SOP', 'utf-8')
      const adapter = makeAdapter(() => ({
        domain: { name: 'd' }, resources: [{ name: 'Loan' }],
      }))

      const result = await ingest({
        sources: [`file://${file}`],
        integrations: {},
        inputs: { 'text/*': adapter },
        llm: LLM,
      })

      expect(result.errors).toEqual([])
      expect(result.dna.resources).toEqual([{ name: 'Loan' }])
      expect(adapter).toHaveBeenCalledTimes(1)
    })

    it('handles bare paths identical to file:// URIs', async () => {
      const file = path.join(tmpDir, 'plain.txt')
      fs.writeFileSync(file, 'hi', 'utf-8')
      const adapter = makeAdapter(() => ({ domain: { name: 'd' } }))
      const result = await ingest({
        sources: [file],
        integrations: {},
        inputs: { 'text/*': adapter },
        llm: LLM,
      })
      expect(result.errors).toEqual([])
      expect(adapter).toHaveBeenCalledTimes(1)
    })

    it('records a non-fatal error for an unknown scheme', async () => {
      const adapter = makeAdapter(() => ({ domain: { name: 'd' } }))
      const result = await ingest({
        sources: ['notion://abc'],
        integrations: {},
        inputs: { 'text/*': adapter },
        llm: LLM,
      })
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({ source: 'notion://abc', stage: 'fetch' })
      expect(adapter).not.toHaveBeenCalled()
    })
  })

  describe('MIME-glob dispatch', () => {
    const fakeIntegration = (mimeType: string): Integration => ({
      async fetch(uri) {
        return {
          contents: 'data',
          mimeType,
          source: { uri, loadedAt: '2025-01-01T00:00:00.000Z' },
        }
      },
    })

    it('records a non-fatal error when no input adapter matches', async () => {
      const result = await ingest({
        sources: ['x://1'],
        integrations: { x: fakeIntegration('application/zip') },
        inputs: { 'text/*': makeAdapter(() => ({ domain: { name: 'd' } })) },
        llm: LLM,
      })
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({ source: 'x://1', stage: 'extract' })
    })

    it('forwards to the matching adapter', async () => {
      const text = makeAdapter(() => ({ domain: { name: 'd' }, resources: [{ name: 'A' }] }))
      const result = await ingest({
        sources: ['x://1'],
        integrations: { x: fakeIntegration('text/markdown') },
        inputs: { 'text/*': text },
        llm: LLM,
      })
      expect(result.errors).toEqual([])
      expect(text).toHaveBeenCalledTimes(1)
    })
  })

  describe('contracts (Integration & InputAdapter)', () => {
    it('a minimal Integration + InputAdapter pair drives the orchestrator end-to-end', async () => {
      const integration: Integration = {
        async fetch(uri) {
          return {
            contents: '# from ' + uri,
            mimeType: 'text/markdown',
            source: { uri, loadedAt: new Date().toISOString() },
          }
        },
      }
      const adapter: InputAdapter = async (contents, _opts) => ({
        domain: { name: 'd' }, resources: [{ name: typeof contents === 'string' ? contents.replace(/[^A-Za-z]/g, '') : 'X' }],
      })

      const result = await ingest({
        sources: ['x://one', 'x://two'],
        integrations: { x: integration },
        inputs: { 'text/*': adapter },
        llm: LLM,
      })

      expect(result.errors).toEqual([])
      const names = (result.dna.resources as Array<{ name: string }>).map((r) => r.name).sort()
      expect(names).toEqual(['fromxone', 'fromxtwo'])
    })
  })

  describe('end-to-end with a stub Drive integration', () => {
    it('produces dna, conflicts, errors, and provenance with the right shape and content', async () => {
      // A stub Integration matching the contract — equivalent to
      // @dna-codes/dna-integration-google-drive in mocked mode.
      const driveStub = (mock: Record<string, { contents: string; mimeType: string }>): Integration => ({
        async fetch(uri) {
          if (!(uri in mock)) throw new Error(`stub: ${uri} not in mock map`)
          return {
            contents: mock[uri].contents,
            mimeType: mock[uri].mimeType,
            source: { uri, loadedAt: '2025-06-01T00:00:00.000Z' },
          }
        },
      })

      const adapter: InputAdapter = async (contents, _opts) => {
        // Return distinct DNA based on which source contributed.
        const hint = String(contents)
        if (hint.includes('A')) return { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }] }
        return { domain: { name: 'd' }, resources: [{ name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] }] }
      }

      const result = await ingest({
        sources: ['gdrive://A', 'gdrive://B'],
        integrations: {
          gdrive: driveStub({
            'gdrive://A': { contents: 'A doc', mimeType: 'text/markdown' },
            'gdrive://B': { contents: 'B doc', mimeType: 'text/markdown' },
          }),
        },
        inputs: { 'text/*': adapter },
        llm: LLM,
      })

      expect(result.errors).toEqual([])
      expect(result.conflicts).toEqual([])

      const resources = result.dna.resources as Array<Record<string, unknown>>
      expect(resources).toHaveLength(1)
      const attrs = (resources[0].attributes as Array<{ name: string }>).map((a) => a.name).sort()
      expect(attrs).toEqual(['amount', 'status'])

      const provenance = result.provenance['resources.Loan']
      expect(provenance.map((s) => s.uri).sort()).toEqual(['gdrive://A', 'gdrive://B'])
    })
  })

  describe('failure handling', () => {
    it('a failed fetch surfaces in errors[]; the run continues', async () => {
      const adapter = makeAdapter(() => ({ domain: { name: 'd' }, resources: [{ name: 'X' }] }))
      const integration: Integration = {
        async fetch(uri) {
          if (uri === 'x://broken') throw new Error('GoogleDriveAuth: token expired')
          return {
            contents: 'ok',
            mimeType: 'text/markdown',
            source: { uri, loadedAt: new Date().toISOString() },
          }
        },
      }
      const result = await ingest({
        sources: ['x://broken', 'x://ok'],
        integrations: { x: integration },
        inputs: { 'text/*': adapter },
        llm: LLM,
      })
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({ source: 'x://broken', stage: 'fetch' })
      expect(result.errors[0].error).toMatch(/token expired/)
      expect(result.dna.resources).toEqual([{ name: 'X' }])
    })

    it('a failed extract surfaces in errors[]; the run continues', async () => {
      const integration: Integration = {
        async fetch(uri) {
          return {
            contents: uri,
            mimeType: 'text/markdown',
            source: { uri, loadedAt: new Date().toISOString() },
          }
        },
      }
      const adapter: InputAdapter = async (contents) => {
        if (String(contents) === 'x://broken') throw new Error('input: malformed JSON')
        return { domain: { name: 'd' }, resources: [{ name: 'X' }] }
      }
      const result = await ingest({
        sources: ['x://broken', 'x://ok'],
        integrations: { x: integration },
        inputs: { 'text/*': adapter },
        llm: LLM,
      })
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({ source: 'x://broken', stage: 'extract' })
      expect(result.dna.resources).toEqual([{ name: 'X' }])
    })
  })

  describe('LLM options pass-through', () => {
    it('every adapter invocation receives the exact llm options', async () => {
      const adapter = makeAdapter(() => ({ domain: { name: 'd' } }))
      const integration: Integration = {
        async fetch(uri) {
          return { contents: '', mimeType: 'text/plain', source: { uri, loadedAt: 'x' } }
        },
      }
      const llm = { model: 'claude-opus-4-7', temperature: 0, seed: 42 }
      await ingest({
        sources: ['x://1', 'x://2', 'x://3'],
        integrations: { x: integration },
        inputs: { 'text/*': adapter },
        llm,
      })
      expect(adapter).toHaveBeenCalledTimes(3)
      for (const call of adapter.mock.calls) {
        expect(call[1]).toEqual({ llm })
      }
    })
  })

  describe('concurrency option', () => {
    it('rejects synchronously when concurrency = 0', async () => {
      const adapter = makeAdapter(() => ({ domain: { name: 'd' } }))
      await expect(
        ingest({
          sources: ['/tmp/x'],
          integrations: {},
          inputs: { 'text/*': adapter },
          llm: LLM,
          concurrency: 0,
        }),
      ).rejects.toThrow(/concurrency/)
    })
  })
})
