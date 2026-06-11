import { createMachine, assign } from 'xstate'

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
}

export const canvasInteractionMachine = createMachine({
  id: 'canvasInteraction',
  initial: 'idle',
  types: {} as {
    context: {
      collapsed: string[]
      selectedNodeId: string | null
      hoveredNodeId: string | null
    }
    events:
      | { type: 'HOVER_NODE'; nodeId: string }
      | { type: 'HOVER_END' }
      | { type: 'SELECT_NODE'; nodeId: string }
      | { type: 'DESELECT' }
      | { type: 'TOGGLE_DOMAIN'; nodeId: string }
  },
  context: {
    collapsed: [] as string[],
    selectedNodeId: null as string | null,
    hoveredNodeId: null as string | null,
  },
  states: {
    idle: {
      on: {
        HOVER_NODE: {
          target: 'nodeHovered',
          actions: assign({ hoveredNodeId: ({ event }) => event.nodeId }),
        },
        SELECT_NODE: {
          target: 'nodeSelected',
          actions: assign({ selectedNodeId: ({ event }) => event.nodeId }),
        },
        TOGGLE_DOMAIN: {
          actions: assign({
            collapsed: ({ context, event }) => toggleInArray(context.collapsed, event.nodeId),
          }),
        },
      },
    },
    nodeHovered: {
      on: {
        HOVER_END: {
          target: 'idle',
          actions: assign({ hoveredNodeId: null }),
        },
        SELECT_NODE: {
          target: 'nodeSelected',
          actions: assign({ selectedNodeId: ({ event }) => event.nodeId }),
        },
        TOGGLE_DOMAIN: {
          actions: assign({
            collapsed: ({ context, event }) => toggleInArray(context.collapsed, event.nodeId),
          }),
        },
      },
    },
    nodeSelected: {
      on: {
        DESELECT: {
          target: 'idle',
          actions: assign({ selectedNodeId: null }),
        },
        SELECT_NODE: {
          actions: assign({ selectedNodeId: ({ event }) => event.nodeId }),
        },
        TOGGLE_DOMAIN: {
          actions: assign({
            collapsed: ({ context, event }) => toggleInArray(context.collapsed, event.nodeId),
          }),
        },
      },
    },
  },
})
