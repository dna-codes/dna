import React from 'react'
import { render, fireEvent } from '@testing-library/react'

jest.mock('@joint/plus', () => ({
  dia: {
    Graph: jest.fn().mockImplementation(() => ({
      addCells: jest.fn(), getCells: jest.fn(() => []),
    })),
    Paper: jest.fn().mockImplementation(() => ({
      el: document.createElement('div'), on: jest.fn(),
    })),
  },
  shapes: {
    standard: {
      Rectangle: jest.fn().mockImplementation((attrs) => ({
        type: 'Rectangle', attrs, id: attrs?.id, embed: jest.fn(), set: jest.fn(), addTo: jest.fn(),
      })),
      Ellipse: jest.fn().mockImplementation((attrs) => ({
        type: 'Ellipse', attrs, id: attrs?.id, embed: jest.fn(), set: jest.fn(), addTo: jest.fn(),
      })),
      Circle: jest.fn().mockImplementation((attrs) => ({
        type: 'Circle', attrs, id: attrs?.id, set: jest.fn(), addTo: jest.fn(),
      })),
      Link: jest.fn().mockImplementation((attrs) => ({
        type: 'Link', attrs, attr: jest.fn(), set: jest.fn(), addTo: jest.fn(),
      })),
    },
  },
}))

import OrgChartCanvas from '../../components/lenses/OrgChartCanvas.client'

const sampleData = {
  nodes: [
    { id: 'domain:marshall', type: 'domain' as const, name: 'marshall' },
    { id: 'group:Case', type: 'group' as const, name: 'Case', parentId: 'domain:marshall' },
  ],
  edges: [],
}

describe('OrgChartCanvas collapse/expand', () => {
  it('renders a collapse button for domain nodes', () => {
    const { getByTestId } = render(<OrgChartCanvas graphData={sampleData} />)
    expect(getByTestId('toggle-domain:marshall')).toBeInTheDocument()
  })

  it('clicking the collapse button toggles the collapsed indicator', () => {
    const { getByTestId } = render(<OrgChartCanvas graphData={sampleData} />)
    const btn = getByTestId('toggle-domain:marshall')
    expect(btn.textContent).toContain('▼')
    fireEvent.click(btn)
    expect(btn.textContent).toContain('▶')
  })

  it('clicking again re-expands the domain', () => {
    const { getByTestId } = render(<OrgChartCanvas graphData={sampleData} />)
    const btn = getByTestId('toggle-domain:marshall')
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn.textContent).toContain('▼')
  })
})
