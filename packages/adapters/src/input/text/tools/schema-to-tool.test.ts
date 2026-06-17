import {
  PRIMITIVE_KINDS,
  buildLayeredTools,
  buildPrimitiveTool,
  injectEnums,
} from './schema-to-tool'

describe('schema-to-tool', () => {
  it('builds one tool per Operational primitive plus finalize', () => {
    const tools = buildLayeredTools()
    expect(tools).toHaveLength(11)
    expect(tools.map((t) => t.name)).toEqual([
      'add_resource',
      'add_person',
      'add_position',
      'add_group',
      'add_membership',
      'add_operation',
      'add_task',
      'add_process',
      'add_trigger',
      'add_rule',
      'finalize',
    ])
  })

  it('inlines $refs to attribute and action sub-schemas', () => {
    const tool = buildPrimitiveTool('resource')
    const props = tool.parameters.properties as Record<string, unknown>
    const attributes = props.attributes as { items: { properties: Record<string, unknown> } }
    expect(attributes.items.properties.type).toBeDefined()
    const actions = props.actions as { items: { properties: Record<string, unknown> } }
    expect(actions.items.properties.name).toBeDefined()
    expect(JSON.stringify(tool.parameters)).not.toContain('$ref')
  })

  it('strips $id and $schema metadata from inlined schemas', () => {
    for (const kind of PRIMITIVE_KINDS) {
      const tool = buildPrimitiveTool(kind)
      const json = JSON.stringify(tool.parameters)
      expect(json).not.toContain('"$id"')
      expect(json).not.toContain('"$schema"')
    }
  })

  it('every primitive tool has type: object parameters', () => {
    for (const kind of PRIMITIVE_KINDS) {
      const tool = buildPrimitiveTool(kind)
      expect(tool.parameters.type).toBe('object')
      expect(tool.parameters.properties).toBeDefined()
    }
  })

  it('finalize takes no parameters', () => {
    const tools = buildLayeredTools()
    const finalize = tools.find((t) => t.name === 'finalize')!
    expect(finalize.parameters).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: {},
    })
  })

  it('injectEnums narrows membership.position to declared position names', () => {
    const tools = buildLayeredTools()
    const narrowed = injectEnums(tools, { positions: ['Underwriter', 'LoanOfficer'] })
    const membership = narrowed.find((t) => t.name === 'add_membership')!
    const props = membership.parameters.properties as Record<string, { enum?: string[] }>
    expect(props.position.enum).toEqual(['Underwriter', 'LoanOfficer'])
  })

  it('injectEnums leaves fields alone when the pool is empty', () => {
    const tools = buildLayeredTools()
    const narrowed = injectEnums(tools, {})
    const membership = narrowed.find((t) => t.name === 'add_membership')!
    const props = membership.parameters.properties as Record<string, { enum?: string[] }>
    expect(props.position.enum).toBeUndefined()
  })

  it('injectEnums does not mutate the source tool list', () => {
    const tools = buildLayeredTools()
    const before = JSON.stringify(tools)
    injectEnums(tools, { positions: ['Underwriter'] })
    expect(JSON.stringify(tools)).toBe(before)
  })
})
