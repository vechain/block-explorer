import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn() }))

vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }))

vi.mock('@/components/error/NotFound', () => ({
  NotFound: ({ title }: { title: string }) => <div data-testid="not-found">{title}</div>,
}))

vi.mock('./components/TransactionPageContent', () => ({
  TransactionPageContent: ({ transactionId }: { transactionId: string }) => (
    <div data-testid="transaction-content">{transactionId}</div>
  ),
}))

import TransactionPage from './page'

const TRANSACTION_ID = `0x${'d'.repeat(64)}`

const renderAt = (pathname: string) => {
  mockUsePathname.mockReturnValue(pathname)
  render(<TransactionPage />)
}

afterEach(cleanup)

describe('TransactionPage', () => {
  it.each([`/transactions/${TRANSACTION_ID}`, `/es/transaction/${TRANSACTION_ID}`])('reads %s', pathname => {
    renderAt(pathname)

    expect(screen.getByTestId('transaction-content').textContent).toBe(TRANSACTION_ID)
  })

  it('renders not found for a malformed transaction id', () => {
    renderAt('/transactions/nonsense')

    expect(screen.getByTestId('not-found')).toBeDefined()
  })
})
