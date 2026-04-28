import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'

const { redirectError, mockRedirect, mockNotFound, mockPrefetchQuery, mockGetQueryData, mockDehydrate } = vi.hoisted(
  () => {
    const redirectError = new Error('redirect')
    const notFoundError = new Error('notFound')

    return {
      redirectError,
      mockRedirect: vi.fn(() => {
        throw redirectError
      }),
      mockNotFound: vi.fn(() => {
        throw notFoundError
      }),
      mockPrefetchQuery: vi.fn(),
      mockGetQueryData: vi.fn(),
      mockDehydrate: vi.fn(() => ({ dehydrated: true })),
    }
  },
)

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
    prefetchQuery: mockPrefetchQuery,
    getQueryData: mockGetQueryData,
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

  const stubTransactionLookups = (lookups: Partial<Record<NetworkName, unknown>>) => {
    mockGetQueryData.mockImplementation((queryKey: unknown[]) => {
      if (queryKey[0] !== 'getTransaction') return undefined
      const networkName = queryKey[1] as NetworkName
      return lookups[networkName]
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDehydrate.mockReturnValue({ dehydrated: true })
    mockPrefetchQuery.mockResolvedValue(undefined)
    mockGetQueryData.mockReturnValue(undefined)
  })

  it('redirects a direct transaction URL to the fallback network', async () => {
    stubTransactionLookups({ [NetworkName.MAINNET]: null, [NetworkName.TESTNET]: transaction })

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: undefined, view: undefined }),
      }),
    ).rejects.toBe(redirectError)

    expect(mockRedirect).toHaveBeenCalledWith(`/transactions/${transactionId}?network=${NetworkName.TESTNET}`)
  })

  it('preserves the selected view when redirecting to the fallback network', async () => {
    stubTransactionLookups({ [NetworkName.MAINNET]: null, [NetworkName.TESTNET]: transaction })

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
    stubTransactionLookups({ [NetworkName.TESTNET]: transaction })

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: NetworkName.TESTNET, view: undefined }),
      }),
    ).resolves.toBeDefined()

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['getTransaction', NetworkName.TESTNET, transactionId],
    })
    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['getTransactionReceipt', NetworkName.TESTNET, transactionId],
    })
  })

  it('renders the page without redirecting when the transaction is missing on both networks', async () => {
    stubTransactionLookups({ [NetworkName.MAINNET]: null, [NetworkName.TESTNET]: null })

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: undefined, view: undefined }),
      }),
    ).resolves.toBeDefined()

    expect(mockNotFound).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('renders the page without redirecting when the active network is unreachable', async () => {
    // Unreachable node: prefetchQuery returns no data, getQueryData returns undefined.
    // No fallback for SOLO either, so we just render and let the client take over.
    stubTransactionLookups({})

    await expect(
      TransactionPage({
        params: Promise.resolve({ txId: transactionId }),
        searchParams: Promise.resolve({ network: NetworkName.SOLO, view: undefined }),
      }),
    ).resolves.toBeDefined()

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockNotFound).not.toHaveBeenCalled()
    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['getTransaction', NetworkName.SOLO, transactionId],
    })
    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['getTransactionReceipt', NetworkName.SOLO, transactionId],
    })
  })
})
