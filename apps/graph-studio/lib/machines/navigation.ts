import { createMachine, assign } from 'xstate'

export const navigationMachine = createMachine({
  id: 'navigation',
  initial: 'home',
  types: {} as {
    context: { activeLens: string | null }
    events:
      | { type: 'SELECT_LENS'; name: string }
      | { type: 'GO_HOME' }
      | { type: 'NOT_FOUND' }
  },
  context: {
    activeLens: null as string | null,
  },
  states: {
    home: {
      on: {
        SELECT_LENS: {
          target: 'lens',
          actions: assign({ activeLens: ({ event }) => event.name }),
        },
      },
    },
    lens: {
      on: {
        GO_HOME: {
          target: 'home',
          actions: assign({ activeLens: null }),
        },
        NOT_FOUND: {
          target: 'notFound',
        },
        SELECT_LENS: {
          actions: assign({ activeLens: ({ event }) => event.name }),
        },
      },
    },
    notFound: {
      on: {
        GO_HOME: {
          target: 'home',
          actions: assign({ activeLens: null }),
        },
      },
    },
  },
})
