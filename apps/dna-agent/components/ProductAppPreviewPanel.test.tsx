/**
 * Tests for the JSON-driven App Preview renderer: the app shell (sidebar pages +
 * content), page switching, the Component→ui-library registry (button + table),
 * and the two-grain access gate (coarse <Surface>, fine <Operation>).
 */

import React from 'react'
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react'
import type { ProductAppPreviewViewModel } from '@dna-codes/dna-mcp'
import { ProductAppPreviewPanel } from './ProductAppPreviewPanel'

// App: Shopwave Admin → Module Order Fulfillment → Workflow → Pages Orders / Shipments.
// Orders has a Toolbar (New Order button) and an Order List (table bound to order).
const viewModel: ProductAppPreviewViewModel = {
  lens: 'product-app-preview',
  roots: [
    {
      id: 'app:shop', name: 'Shopwave Admin', level: 'app', planned: false,
      children: [
        {
          id: 'mod:ful', name: 'Order Fulfillment', level: 'module', planned: false,
          children: [
            {
              id: 'wf:ful', name: 'Fulfill Order', level: 'workflow', planned: false,
              children: [
                {
                  id: 'page:orders', name: 'Orders', level: 'page', planned: false, layout: 'AdminLayout',
                  children: [
                    { id: 'sec:tool', name: 'Toolbar', level: 'section', planned: false, children: [
                      { id: 'cmp:new', name: 'New Order', level: 'component', planned: false, uiType: 'button', children: [] },
                    ] },
                    { id: 'sec:list', name: 'Order List', level: 'section', planned: false, children: [
                      { id: 'cmp:table', name: 'Orders', level: 'component', planned: false, uiType: 'table', children: [] },
                    ] },
                  ],
                },
                { id: 'page:ship', name: 'Shipments', level: 'page', planned: false, layout: 'AdminLayout', children: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
  access: {
    grants: [
      { subject: 'Manager', surface: 'app:shop' },
      { subject: 'Picker', surface: 'app:shop' },
      { subject: 'Outsider', surface: 'app:other' },
    ],
    contains: [
      { parent: 'app:shop', child: 'mod:ful' },
      { parent: 'mod:ful', child: 'wf:ful' },
      { parent: 'wf:ful', child: 'page:orders' },
      { parent: 'wf:ful', child: 'page:ship' },
    ],
  },
  surfaceOperations: [],
  operationAllows: [{ operation: 'New Order', role: 'Manager' }],
  surfaceRecords: [
    { surface: 'cmp:table', resourceType: 'order', columns: ['name', 'customer', 'status'], rows: [{ id: 'o1', name: 'SW-1', customer: 'Ava', status: 'paid' }] },
  ],
  subjects: ['Manager', 'Outsider', 'Picker'],
}

function mockFetchOnce(vm: ProductAppPreviewViewModel) {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => vm })
  ;(global as unknown as { fetch: jest.Mock }).fetch = fetchMock
  return fetchMock
}

describe('ProductAppPreviewPanel', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('renders the app shell: sidebar pages and the default page with its bound table', async () => {
    mockFetchOnce(viewModel)
    render(<ProductAppPreviewPanel refreshSignal={0} />)
    await waitFor(() => expect(screen.getByText('Shopwave Admin')).toBeInTheDocument())
    // Sidebar nav lists the pages.
    expect(screen.getByRole('button', { name: 'Orders' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shipments' })).toBeInTheDocument()
    // Default page (first) renders its section + the bound order row.
    expect(screen.getByText('Order List')).toBeInTheDocument()
    expect(screen.getByText('Ava')).toBeInTheDocument()
    expect(screen.getByText('paid')).toBeInTheDocument()
  })

  it('switches the content pane when a sidebar page is clicked', async () => {
    mockFetchOnce(viewModel)
    render(<ProductAppPreviewPanel refreshSignal={0} />)
    await waitFor(() => expect(screen.getByText('Ava')).toBeInTheDocument())
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Shipments' })) })
    // Orders table gone; Shipments (no sections) shows the empty note.
    expect(screen.queryByText('Ava')).not.toBeInTheDocument()
    expect(screen.getByText(/no sections yet/i)).toBeInTheDocument()
  })

  it('coarse gate hides pages and content for a subject without access', async () => {
    mockFetchOnce(viewModel)
    render(<ProductAppPreviewPanel refreshSignal={0} />)
    await waitFor(() => expect(screen.getByText('Ava')).toBeInTheDocument())
    await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Outsider' } }) })
    // No reachable pages: nav items gone and the content pane shows the empty state.
    expect(screen.queryByRole('button', { name: 'Orders' })).not.toBeInTheDocument()
    expect(screen.queryByText('Ava')).not.toBeInTheDocument()
    expect(screen.getByText(/select a page/i)).toBeInTheDocument()
  })

  it('defaults to the first page the previewed subject can actually open', async () => {
    // Picker is granted the app (so Orders is reachable) — selecting Picker keeps content.
    mockFetchOnce(viewModel)
    render(<ProductAppPreviewPanel refreshSignal={0} />)
    await waitFor(() => expect(screen.getByText('Ava')).toBeInTheDocument())
    await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Picker' } }) })
    expect(screen.getByText('Ava')).toBeInTheDocument()
  })

  it('fine gate disables an operation the previewed role cannot perform', async () => {
    mockFetchOnce(viewModel)
    render(<ProductAppPreviewPanel refreshSignal={0} />)
    await waitFor(() => expect(screen.getByText('Shopwave Admin')).toBeInTheDocument())
    // Author bypass: New Order enabled.
    expect(screen.getByRole('button', { name: 'New Order' })).not.toBeDisabled()
    // Picker is granted the app (coarse) but not the New Order op (fine) → disabled.
    await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Picker' } }) })
    expect(screen.getByRole('button', { name: 'New Order' })).toBeDisabled()
  })
})
