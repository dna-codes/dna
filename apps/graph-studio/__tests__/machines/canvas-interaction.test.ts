import { createActor } from 'xstate'
import { canvasInteractionMachine } from '../../lib/machines/canvas-interaction'

describe('canvasInteractionMachine', () => {
  it('starts in idle with empty context', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('idle')
    expect(snap.context.collapsed).toEqual([])
    expect(snap.context.selectedNodeId).toBeNull()
    expect(snap.context.hoveredNodeId).toBeNull()
    actor.stop()
  })

  it('HOVER_NODE transitions to nodeHovered with hoveredNodeId', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'HOVER_NODE', nodeId: 'domain:marshall' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('nodeHovered')
    expect(snap.context.hoveredNodeId).toBe('domain:marshall')
    actor.stop()
  })

  it('HOVER_END returns to idle', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'HOVER_NODE', nodeId: 'domain:marshall' })
    actor.send({ type: 'HOVER_END' })
    expect(actor.getSnapshot().value).toBe('idle')
    actor.stop()
  })

  it('SELECT_NODE transitions to nodeSelected from idle', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'SELECT_NODE', nodeId: 'role:LeadCounsel' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('nodeSelected')
    expect(snap.context.selectedNodeId).toBe('role:LeadCounsel')
    actor.stop()
  })

  it('SELECT_NODE transitions to nodeSelected from nodeHovered', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'HOVER_NODE', nodeId: 'domain:marshall' })
    actor.send({ type: 'SELECT_NODE', nodeId: 'role:LeadCounsel' })
    expect(actor.getSnapshot().value).toBe('nodeSelected')
    actor.stop()
  })

  it('DESELECT returns to idle with null selectedNodeId', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'SELECT_NODE', nodeId: 'role:LeadCounsel' })
    actor.send({ type: 'DESELECT' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('idle')
    expect(snap.context.selectedNodeId).toBeNull()
    actor.stop()
  })

  it('TOGGLE_DOMAIN adds domain id to collapsed from idle', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'TOGGLE_DOMAIN', nodeId: 'domain:marshall' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('idle')
    expect(snap.context.collapsed).toContain('domain:marshall')
    actor.stop()
  })

  it('TOGGLE_DOMAIN removes domain id when already collapsed (idempotent toggle)', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'TOGGLE_DOMAIN', nodeId: 'domain:marshall' })
    actor.send({ type: 'TOGGLE_DOMAIN', nodeId: 'domain:marshall' })
    expect(actor.getSnapshot().context.collapsed).not.toContain('domain:marshall')
    actor.stop()
  })

  it('TOGGLE_DOMAIN works from nodeHovered state', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'HOVER_NODE', nodeId: 'domain:marshall' })
    actor.send({ type: 'TOGGLE_DOMAIN', nodeId: 'domain:marshall' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('nodeHovered')
    expect(snap.context.collapsed).toContain('domain:marshall')
    actor.stop()
  })

  it('TOGGLE_DOMAIN works from nodeSelected state', () => {
    const actor = createActor(canvasInteractionMachine)
    actor.start()
    actor.send({ type: 'SELECT_NODE', nodeId: 'role:LeadCounsel' })
    actor.send({ type: 'TOGGLE_DOMAIN', nodeId: 'domain:marshall' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('nodeSelected')
    expect(snap.context.collapsed).toContain('domain:marshall')
    actor.stop()
  })
})
