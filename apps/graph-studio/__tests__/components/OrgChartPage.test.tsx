import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('../../lib/db', () => ({ getDb: () => null }))

jest.mock('next/dynamic', () => (_fn: unknown) => {
  return function MockCanvas() {
    return <div data-testid="graph-canvas" />
  }
})

import OrgChartPage from '../../app/lens/org-chart/page'

describe('OrgChartPage', () => {
  it('renders canvas with fixture data when no DB connected', async () => {
    const page = await OrgChartPage()
    render(page as React.ReactElement)
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument()
  })

  it('shows the DNA summary section', async () => {
    const page = await OrgChartPage()
    render(page as React.ReactElement)
    expect(screen.getByText(/about this dna/i)).toBeInTheDocument()
  })
})
