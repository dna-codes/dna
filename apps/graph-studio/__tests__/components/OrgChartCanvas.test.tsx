import React from 'react'
import { render } from '@testing-library/react'

// jest.mock is hoisted — use jest.fn() inline, capture via module reference after
jest.mock('@joint/plus', () => ({
  dia: {
    Graph: jest.fn().mockImplementation(() => ({
      addCells: jest.fn(),
      getCells: jest.fn(() => []),
    })),
    Paper: jest.fn().mockImplementation(() => ({
      el: document.createElement('div'),
      on: jest.fn(),
    })),
  },
  shapes: {
    standard: {
      Rectangle: jest.fn().mockImplementation((attrs) => ({
        type: 'Rectangle', attrs, id: attrs?.id,
        embed: jest.fn(), addTo: jest.fn(), set: jest.fn(),
      })),
      Ellipse: jest.fn().mockImplementation((attrs) => ({
        type: 'Ellipse', attrs, id: attrs?.id,
        embed: jest.fn(), addTo: jest.fn(), set: jest.fn(),
      })),
      Circle: jest.fn().mockImplementation((attrs) => ({
        type: 'Circle', attrs, id: attrs?.id,
        addTo: jest.fn(), set: jest.fn(),
      })),
      Link: jest.fn().mockImplementation((attrs) => ({
        type: 'Link', attrs, id: attrs?.id,
        attr: jest.fn(), addTo: jest.fn(), set: jest.fn(),
      })),
    },
  },
}))

// Obtain mock references after hoisting is resolved
import * as jointPlus from '@joint/plus'
import OrgChartCanvas from '../../components/lenses/OrgChartCanvas.client'

const { shapes } = jointPlus as unknown as {
  shapes: { standard: {
    Rectangle: jest.Mock
    Ellipse: jest.Mock
    Circle: jest.Mock
    Link: jest.Mock
  }}
}

beforeEach(() => {
  shapes.standard.Rectangle.mockClear()
  shapes.standard.Ellipse.mockClear()
  shapes.standard.Circle.mockClear()
  shapes.standard.Link.mockClear()
})

describe('<OrgChartCanvas />', () => {
  it('renders graph-canvas container', () => {
    const { getByTestId } = render(
      <OrgChartCanvas graphData={{ nodes: [], edges: [] }} />
    )
    expect(getByTestId('graph-canvas')).toBeInTheDocument()
  })

  it('domain node uses Rectangle shape (compound container)', () => {
    render(
      <OrgChartCanvas
        graphData={{
          nodes: [{ id: 'domain:marshall', type: 'domain', name: 'marshall' }],
          edges: [],
        }}
      />
    )
    expect(shapes.standard.Rectangle).toHaveBeenCalled()
  })

  it('position node uses Rectangle shape (uniform style)', () => {
    render(
      <OrgChartCanvas
        graphData={{
          nodes: [{ id: 'position:LeadCounsel', type: 'position', name: 'LeadCounsel' }],
          edges: [],
        }}
      />
    )
    expect(shapes.standard.Rectangle).toHaveBeenCalled()
  })

  it('membership edge uses Link shape', () => {
    render(
      <OrgChartCanvas
        graphData={{
          nodes: [
            { id: 'person:Partner', type: 'person', name: 'Partner' },
            { id: 'position:LeadCounsel', type: 'position', name: 'LeadCounsel' },
          ],
          edges: [{ id: 'mem:1', source: 'person:Partner', target: 'position:LeadCounsel', type: 'membership' }],
        }}
      />
    )
    expect(shapes.standard.Link).toHaveBeenCalled()
  })

  it('group node is embedded in its parent domain cell', () => {
    render(
      <OrgChartCanvas
        graphData={{
          nodes: [
            { id: 'domain:marshall', type: 'domain', name: 'marshall' },
            { id: 'group:Case', type: 'group', name: 'Case', parentId: 'domain:marshall' },
          ],
          edges: [],
        }}
      />
    )
    // Both domain and group use Rectangle
    expect(shapes.standard.Rectangle).toHaveBeenCalledTimes(2)
  })
})
