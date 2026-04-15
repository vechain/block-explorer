import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'

const { redirectError, notFoundError, mockRedirect, mockNotFound, mockFetchQuery, mockPrefetchQuery, mockDehydrate } =
  vi.hoisted(() => {
    const redirectError = new Error('redirect')
    const notFoundError = new Error('notFound')

    return {
      redirectError,
      notFoundError,
      mockRedirect: vi.fn(() => {
        throw redirectError
      }),
      mockNotFound: vi.fn(() => {
        throw notFoundError
      }),
      mockFetchQuery: vi.fn(),
      mockPrefetchQuery: vi.fn(),
      mockDehydrate: vi.fn(() => ({ dehydrated: true })),
    }
  })

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}))

vi.mock('@tanstack/react-query', () => ({
  dehydrate: mockDehydrate,
  HydrationBoundary: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/lib/query-client/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
    prefetchQuery: mockPrefetchQuery,
  }),
}))

vi.mock('@/services/thor/transaction', () => ({
  transactionQueryOptions: (networkName: NetworkName, transactionId: string) => ({
    queryKey: ['getTransaction', networkName, transactionId],
  }),
  transactionReceiptQueryOptions: (networkName: NetworkName, transactionId: string) => ({
    queryKey: ['getTransactionReceipt', networkName, transactionId],
  }),
}))

vi.mock('./components/TransactionPageContent', () => ({
  TransactionPageContent: () => null,
}))

import TransactionPage from './page'

describe('TransactionPage', () => {
  const transactionId = '0x1890a7d5ffce967a849a35d9f5cc24b5cb85e1d1de02cc1d6f5698d35ae58ba5'
  const transaction = { id: transactionId }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDehydrate.mockReturnValue({ dehydrated: true })
    mockPrefetchQuery.mockResolvedValue(undefined)
  })

  it('redirects a direct transaction URL to the fallback network', async () => {
    mockFetchQuery.mockResolvedValueOnce(null).mockResolvedValueOnce(transaction)

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: undefined, view: undefined }),
      }),
    ).rejects.toBe(redirectError)

    expect(mockRedirect).toHaveBeenCalledWith(`/transactions/${transactionId}?network=${NetworkName.TESTNET}`)
    expect(mockPrefetchQuery).not.toHaveBeenCalled()
  })

  it('preserves the selected view when redirecting to the fallback network', async () => {
    mockFetchQuery.mockResolvedValueOnce(null).mockResolvedValueOnce(transaction)

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: NetworkName.MAINNET, view: 'events' }),
      }),
    ).rejects.toBe(redirectError)

    expect(mockRedirect).toHaveBeenCalledWith(
      `/transactions/${transactionId}?view=events&network=${NetworkName.TESTNET}`,
    )
  })

  it('prefetches the receipt when the requested network is already correct', async () => {
    mockFetchQuery.mockResolvedValueOnce(transaction)

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: NetworkName.TESTNET, view: undefined }),
      }),
    ).resolves.toBeDefined()

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockFetchQuery).toHaveBeenCalledWith({
      queryKey: ['getTransaction', NetworkName.TESTNET, transactionId],
    })
    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['getTransactionReceipt', NetworkName.TESTNET, transactionId],
    })
  })

  it('renders not found when the transaction is missing on both networks', async () => {
    mockFetchQuery.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: undefined, view: undefined }),
      }),
    ).rejects.toBe(notFoundError)

    expect(mockNotFound).toHaveBeenCalled()
  })
})
