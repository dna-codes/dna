import { parse } from '../index'

interface ScriptedCall {
  name: string
  args: Record<string, unknown>
}

function scriptedFetch(script: ScriptedCall[]): { fetchImpl: typeof fetch; calls: number } {
  let i = 0
  const state = { calls: 0 }
  const fetchImpl = (async (_url: unknown, _init?: RequestInit) => {
    state.calls += 1
    const next = i < script.length ? script[i++] : null
    let body: unknown
    if (!next) {
      body = {
        choices: [
          { message: { role: 'assistant', content: 'done', tool_calls: undefined } },
        ],
      }
    } else {
      body = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: `call_${i}`,
                  type: 'function',
                  function: { name: next.name, arguments: JSON.stringify(next.args) },
                },
              ],
            },
          },
        ],
      }
    }
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response
  }) as typeof fetch
  return { fetchImpl, get calls() { return state.calls } } as unknown as { fetchImpl: typeof fetch; calls: number }
}

describe('parse() — layered mode', () => {
  it('round-trips a known-good operational document via stubbed tool calls', async () => {
    const script: ScriptedCall[] = [
      { name: 'add_resource', args: { name: 'Loan' } },
      { name: 'add_person', args: { name: 'Borrower' } },
      { name: 'add_person', args: { name: 'Employee' } },
      { name: 'add_group', args: { name: 'BankDepartment' } },
      { name: 'add_position', args: { name: 'Underwriter', scope: 'BankDepartment' } },
      {
        name: 'add_membership',
        args: { name: 'EmployeeUnderwriter', person: 'Employee', position: 'Underwriter' },
      },
      {
        name: 'add_operation',
        args: { target: 'Loan', action: 'Apply', name: 'Loan.Apply' },
      },
      { name: 'finalize', args: {} },
    ]
    const { fetchImpl } = scriptedFetch(script)
    const result = await parse('A lending business.', {
      provider: 'openai',
      apiKey: 'sk-test',
      mode: 'layered',
      fetchImpl,
    })
    expect(result.operational).toBeDefined()
    expect(result.missingLayers).toEqual([])
    const op = result.operational as { resources: unknown[] }
    expect(op.resources).toHaveLength(1)
  })

  it('feeds back unknown_position and accepts the corrected sequence', async () => {
    const script: ScriptedCall[] = [
      { name: 'add_person', args: { name: 'Employee' } },
      // Bad call: role hasn't been declared yet
      {
        name: 'add_membership',
        args: { name: 'EmployeeUnderwriter', person: 'Employee', position: 'Underwriter' },
      },
      // Recovery
      { name: 'add_group', args: { name: 'BankDepartment' } },
      { name: 'add_position', args: { name: 'Underwriter', scope: 'BankDepartment' } },
      {
        name: 'add_membership',
        args: { name: 'EmployeeUnderwriter', person: 'Employee', position: 'Underwriter' },
      },
      { name: 'finalize', args: {} },
    ]
    const { fetchImpl } = scriptedFetch(script)
    const result = await parse('Domain text.', {
      provider: 'openai',
      apiKey: 'sk-test',
      mode: 'layered',
      fetchImpl,
    })
    expect(result.operational).toBeDefined()
    const transcript = JSON.parse(result.raw) as { name: string; result: { ok: boolean; error?: string } }[]
    const failure = transcript.find((t) => t.result.ok === false)
    expect(failure).toBeDefined()
    expect(failure!.result.error).toBe('unknown_position')
  })

  it('reports missingLayers when the loop ends without finalizing', async () => {
    const script: ScriptedCall[] = [
      { name: 'add_resource', args: { name: 'Loan' } },
      // No finalize; provider then returns a final text and the loop exits.
    ]
    const { fetchImpl } = scriptedFetch(script)
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await parse('text', {
      provider: 'openai',
      apiKey: 'sk-test',
      mode: 'layered',
      fetchImpl,
    })
    expect(result.operational).toBeUndefined()
    expect(result.missingLayers).toEqual(['operational'])
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Missing: operational/))
    warn.mockRestore()
  })

  it('honors maxToolCalls and stops the loop', async () => {
    const script: ScriptedCall[] = [
      { name: 'add_person', args: { name: 'A' } },
      { name: 'add_person', args: { name: 'B' } },
      { name: 'add_person', args: { name: 'C' } },
      { name: 'add_person', args: { name: 'D' } },
    ]
    const { fetchImpl } = scriptedFetch(script)
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(
      parse('x', {
        provider: 'openai',
        apiKey: 'sk-test',
        mode: 'layered',
        maxToolCalls: 2,
        fetchImpl,
      }),
    ).rejects.toThrow(/Iteration cap of 2/)
    warn.mockRestore()
  })

  it('default mode (omitted) still calls the one-shot path', async () => {
    const calls: { url: string; body: string }[] = []
    const fetchImpl = (async (url: unknown, init?: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body ?? '') })
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  operational: { domain: { name: 'x' } },
                }),
              },
            },
          ],
        }),
        text: async () => '',
      } as Response
    }) as typeof fetch
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await parse('text', { provider: 'openai', apiKey: 'sk-test', fetchImpl })
    warn.mockRestore()
    expect(calls).toHaveLength(1)
    const body = JSON.parse(calls[0].body)
    expect(body.tools).toBeUndefined()
    expect(body.response_format).toEqual({ type: 'json_object' })
  })
})
