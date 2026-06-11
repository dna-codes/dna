import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('../../lib/db', () => ({ getDb: () => null }))
jest.mock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))
jest.mock('next/dynamic', () => (_fn: unknown) => {
  return function MockDynamic() {
    return <div data-testid="graph-canvas" />
  }
})

import LensPage from '../../app/lens/[name]/page'

describe('LensPage', () => {
  it('renders canvas container for a known lens', async () => {
    const page = await LensPage({ params: Promise.resolve({ name: 'org-chart' }) })
    render(page as React.ReactElement)
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument()
  })

  it('calls notFound() for an unknown lens', async () => {
    await expect(LensPage({ params: Promise.resolve({ name: 'unknown-lens' }) }))
      .rejects.toThrow('NEXT_NOT_FOUND')
  })
})
