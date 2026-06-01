import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { DnaProvider, Operation, useOperation } from './index'
import type { AuditEvent } from './index'

// Minimal lending DNA fixture
const dna = {
  domain: {
    name: 'lending',
    path: 'test.lending',
    resources: [{ name: 'Loan', actions: [{ name: 'Apply', type: 'write' }, { name: 'Approve', type: 'write' }] }],
    persons: [],
    groups: [],
    roles: [{ name: 'Borrower' }, { name: 'Underwriter' }],
  },
  rules: [
    { id: '1', type: 'rule', version: '1', name: 'ApplyAccess',   operation: 'Loan.Apply',   rule_type: 'access', allow: [{ role: 'Borrower' }] },
    { id: '2', type: 'rule', version: '1', name: 'ApproveAccess', operation: 'Loan.Approve', rule_type: 'access', allow: [{ role: 'Underwriter' }] },
  ],
} as any

// Helper: a component that surfaces useOperation results
function OperationStatus({ name }: { name: string }) {
  const { permitted } = useOperation(name)
  return <div data-testid="status">{permitted ? 'permitted' : 'denied'}</div>
}

// Helper: a component that calls perform and records the result
function PerformButton({ name, onResult }: { name: string; onResult: (r: { permitted: boolean }) => void }) {
  const { perform } = useOperation(name)
  return <button onClick={() => perform({ test: true }).then(onResult)}>go</button>
}

describe('@dna-codes/dna-react', () => {
  describe('DnaProvider + useOperation — permitted state', () => {
    it('returns permitted=true for an allowed role (pre-resolved)', async () => {
      render(
        <DnaProvider dna={dna} userId="alice" roles={['Underwriter']}>
          <OperationStatus name="Loan.Approve" />
        </DnaProvider>
      )
      expect(screen.getByTestId('status').textContent).toBe('permitted')
    })

    it('returns permitted=false for a disallowed user (pre-resolved)', () => {
      render(
        <DnaProvider dna={dna} userId="bob" roles={['Borrower']}>
          <OperationStatus name="Loan.Approve" />
        </DnaProvider>
      )
      expect(screen.getByTestId('status').textContent).toBe('denied')
    })

    it('shows loading then resolves with resolveRoles', async () => {
      let resolve!: (roles: string[]) => void
      const resolveRoles = () => new Promise<string[]>(r => { resolve = r })

      render(
        <DnaProvider dna={dna} userId="alice" resolveRoles={resolveRoles}>
          <OperationStatus name="Loan.Approve" />
        </DnaProvider>
      )
      // While resolving, permitted should be false
      expect(screen.getByTestId('status').textContent).toBe('denied')

      // Resolve with Underwriter role
      await act(async () => { resolve(['Underwriter']) })
      await waitFor(() =>
        expect(screen.getByTestId('status').textContent).toBe('permitted')
      )
    })
  })

  describe('<Operation>', () => {
    it('renders children when permitted and enabled', () => {
      render(
        <DnaProvider dna={dna} userId="alice" roles={['Underwriter']}>
          <Operation name="Loan.Approve">
            <span>approve button</span>
          </Operation>
        </DnaProvider>
      )
      expect(screen.getByText('approve button')).toBeInTheDocument()
    })

    it('renders fallback when not permitted', () => {
      render(
        <DnaProvider dna={dna} userId="bob" roles={['Borrower']}>
          <Operation name="Loan.Approve" fallback={<span>no access</span>}>
            <span>approve button</span>
          </Operation>
        </DnaProvider>
      )
      expect(screen.queryByText('approve button')).not.toBeInTheDocument()
      expect(screen.getByText('no access')).toBeInTheDocument()
    })

    it('renders fallback when flag resolver returns false', () => {
      render(
        <DnaProvider dna={dna} userId="alice" roles={['Underwriter']} flags={() => false}>
          <Operation name="Loan.Approve" fallback={<span>flagged off</span>}>
            <span>approve button</span>
          </Operation>
        </DnaProvider>
      )
      expect(screen.queryByText('approve button')).not.toBeInTheDocument()
      expect(screen.getByText('flagged off')).toBeInTheDocument()
    })

    it('renders loading prop while roles are resolving', async () => {
      let resolve!: (roles: string[]) => void
      const resolveRoles = () => new Promise<string[]>(r => { resolve = r })

      render(
        <DnaProvider dna={dna} userId="alice" resolveRoles={resolveRoles}>
          <Operation name="Loan.Approve" loading={<span>loading...</span>} fallback={<span>no access</span>}>
            <span>approve button</span>
          </Operation>
        </DnaProvider>
      )
      expect(screen.getByText('loading...')).toBeInTheDocument()
      await act(async () => { resolve(['Underwriter']) })
      await waitFor(() => expect(screen.getByText('approve button')).toBeInTheDocument())
    })
  })

  describe('perform() and onAudit', () => {
    it('fires onAudit with correct AuditEvent for a permitted action', async () => {
      const events: AuditEvent[] = []
      render(
        <DnaProvider dna={dna} userId="alice" roles={['Underwriter']} onAudit={e => { events.push(e) }}>
          <PerformButton name="Loan.Approve" onResult={() => {}} />
        </DnaProvider>
      )
      await act(async () => { screen.getByRole('button').click() })
      await waitFor(() => expect(events).toHaveLength(1))
      expect(events[0]).toMatchObject({
        operation: 'Loan.Approve',
        resource:  'Loan',
        action:    'Approve',
        userId:    'alice',
        permitted: true,
        payload:   { test: true },
      })
      expect(typeof events[0].timestamp).toBe('string')
    })

    it('fires onAudit with permitted=false for a blocked action', async () => {
      const events: AuditEvent[] = []
      render(
        <DnaProvider dna={dna} userId="bob" roles={['Borrower']} onAudit={e => { events.push(e) }}>
          <PerformButton name="Loan.Approve" onResult={() => {}} />
        </DnaProvider>
      )
      await act(async () => { screen.getByRole('button').click() })
      await waitFor(() => expect(events).toHaveLength(1))
      expect(events[0].permitted).toBe(false)
    })

    it('swallows onAudit errors and still returns { permitted }', async () => {
      const results: { permitted: boolean }[] = []
      render(
        <DnaProvider
          dna={dna} userId="alice" roles={['Underwriter']}
          onAudit={() => { throw new Error('sink failed') }}
        >
          <PerformButton name="Loan.Approve" onResult={r => results.push(r)} />
        </DnaProvider>
      )
      await act(async () => { screen.getByRole('button').click() })
      await waitFor(() => expect(results).toHaveLength(1))
      expect(results[0]).toEqual({ permitted: true })
    })
  })

  describe('useOperation outside DnaProvider', () => {
    it('throws a descriptive error', () => {
      const original = console.error
      console.error = () => {}
      expect(() => {
        render(<OperationStatus name="Loan.Approve" />)
      }).toThrow(/DnaProvider/)
      console.error = original
    })
  })
})
