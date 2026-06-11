import { createActor } from 'xstate'
import { navigationMachine } from '../../lib/machines/navigation'

describe('navigationMachine', () => {
  it('initial state is home', () => {
    const actor = createActor(navigationMachine)
    actor.start()
    expect(actor.getSnapshot().value).toBe('home')
    expect(actor.getSnapshot().context.activeLens).toBeNull()
    actor.stop()
  })

  it('SELECT_LENS transitions to lens with correct activeLens', () => {
    const actor = createActor(navigationMachine)
    actor.start()
    actor.send({ type: 'SELECT_LENS', name: 'org-chart' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('lens')
    expect(snap.context.activeLens).toBe('org-chart')
    actor.stop()
  })

  it('GO_HOME from lens returns to home with null activeLens', () => {
    const actor = createActor(navigationMachine)
    actor.start()
    actor.send({ type: 'SELECT_LENS', name: 'org-chart' })
    actor.send({ type: 'GO_HOME' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('home')
    expect(snap.context.activeLens).toBeNull()
    actor.stop()
  })

  it('NOT_FOUND transitions to notFound', () => {
    const actor = createActor(navigationMachine)
    actor.start()
    actor.send({ type: 'SELECT_LENS', name: 'unknown' })
    actor.send({ type: 'NOT_FOUND' })
    expect(actor.getSnapshot().value).toBe('notFound')
    actor.stop()
  })

  it('GO_HOME from notFound returns to home', () => {
    const actor = createActor(navigationMachine)
    actor.start()
    actor.send({ type: 'SELECT_LENS', name: 'unknown' })
    actor.send({ type: 'NOT_FOUND' })
    actor.send({ type: 'GO_HOME' })
    expect(actor.getSnapshot().value).toBe('home')
    actor.stop()
  })

  it('is testable with createActor — no router required', () => {
    const actor = createActor(navigationMachine)
    actor.start()
    actor.send({ type: 'SELECT_LENS', name: 'test-lens' })
    expect(actor.getSnapshot().value).toBe('lens')
    expect(actor.getSnapshot().context.activeLens).toBe('test-lens')
    actor.stop()
  })
})
