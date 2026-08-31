import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NETWORK, NetworkName } from '@/lib/constants/network'
import { makeQueryClient } from '@/lib/query-client/query-client'
import type { TransactionId } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'

const { mockReplace, mockUseSearchParams, lookups } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockUseSearchParams: vi.fn(),
  lookups: new Map<string, unknown>(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => PATHNAME,
  useSearchParams: mockUseSearchParams,
}))

vi.mock('@/services/thor/transaction', () => ({
  transactionQueryOptions: (networkName: NetworkName, transactionId: string) => ({
    queryKey: ['getTransaction', networkName, transactionId],
    queryFn: () => Promise.resolve(lookups.get(networkName) ?? null),
    staleTime: Infinity,
  }),
}))

import { useResolvedTransaction } from './useResolvedTransaction'

const TRANSACTION_ID = `0x${'d'.repeat(64)}` as TransactionId
const PATHNAME = `/transactions/${TRANSACTION_ID}`
const transaction = { id: TRANSACTION_ID }

const renderResolved = (search = '') => {
  mockUseSearchParams.mockReturnValue(new URLSearchParams(search))
  const queryClient = makeQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return renderHook(() => useResolvedTransaction(TRANSACTION_ID), { wrapper })
}

beforeEach(() => {
  vi.clearAllMocks()
  lookups.clear()
})

afterEach(() => {
  useSettingsStore.setState({ activeNetwork: DEFAULT_NETWORK })
})

describe('useResolvedTransaction', () => {
  it('retries the fallback network and pins the URL to it', async () => {
    lookups.set(NetworkName.TESTNET, transaction)

    const { result } = renderResolved()

    await waitFor(() => expect(result.current.transaction).toBe(transaction))
    expect(result.current.networkName).toBe(NetworkName.TESTNET)
    expect(mockReplace).toHaveBeenCalledWith(`${PATHNAME}?network=${NetworkName.TESTNET}`, { scroll: false })
  })

  it('preserves the other search params when pinning', async () => {
    lookups.set(NetworkName.TESTNET, transaction)

    renderResolved(`network=${NetworkName.MAINNET}&view=events`)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(`${PATHNAME}?network=${NetworkName.TESTNET}&view=events`, {
        scroll: false,
      }),
    )
  })

  it('does not redirect when the requested network already holds it', async () => {
    lookups.set(NetworkName.TESTNET, transaction)

    const { result } = renderResolved(`network=${NetworkName.TESTNET}`)

    await waitFor(() => expect(result.current.transaction).toBe(transaction))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('reports not found once both networks have missed', async () => {
    const { result } = renderResolved()

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.transaction).toBeNull()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not look for a fallback when the network has none', async () => {
    const { result } = renderResolved(`network=${NetworkName.SOLO}`)

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.networkName).toBe(NetworkName.SOLO)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
