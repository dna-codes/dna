import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('../../lib/db', () => ({ getDb: () => null }))

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
})

import HomePage from '../../app/page'

describe('HomePage', () => {
  it('renders all four example cards', () => {
    render(<HomePage />)
    expect(screen.getByText('Marshall Fire Justice')).toBeInTheDocument()
    expect(screen.getByText('Apex Commerce')).toBeInTheDocument()
    expect(screen.getByText('ClearPath Lending')).toBeInTheDocument()
    expect(screen.getByText('Content Operations')).toBeInTheDocument()
  })

  it('renders lens links for each example', () => {
    render(<HomePage />)
    // Each example has 5 lens pills → 20 total
    expect(screen.getAllByRole('link')).toHaveLength(20)
    // Each example has an Org Chart lens link
    const orgChartLinks = screen.getAllByRole('link', { name: /org chart/i })
    expect(orgChartLinks).toHaveLength(4)
  })

  it('renders the page heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('mass-torts org-chart link points to correct route', () => {
    render(<HomePage />)
    const links = screen.getAllByRole('link') as HTMLAnchorElement[]
    const orgChartLink = links.find(l => l.href.includes('/lens/mass-torts/org-chart'))
    expect(orgChartLink).toBeTruthy()
  })
})
