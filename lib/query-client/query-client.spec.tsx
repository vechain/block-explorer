import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_NETWORK, NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { makeQueryClient } from './query-client'

const switchNetwork = (networkName: NetworkName) =>
  act(() => {
    useSettingsStore.getState().setActiveNetwork(networkName)
  })

const renderNetworkScopedQuery = () => {
  const queryClient = makeQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return renderHook(
    ({ page }: { page: number }) => {
      const { activeNetwork } = useSettingsStore()
      return useQuery({
        queryKey: ['rows', activeNetwork.name, page],
        queryFn: () => Promise.resolve(`${activeNetwork.name}-page-${page}`),
      })
    },
    { wrapper, initialProps: { page: 0 } },
  )
}

afterEach(() => {
  useSettingsStore.setState({ activeNetwork: DEFAULT_NETWORK })
})

describe('query client placeholder defaults', () => {
  it('keeps the previous page while the next page of the same network loads', async () => {
    const { result, rerender } = renderNetworkScopedQuery()
    await waitFor(() => expect(result.current.data).toBe('mainnet-page-0'))

    rerender({ page: 1 })

    expect(result.current.data).toBe('mainnet-page-0')
    expect(result.current.isPlaceholderData).toBe(true)

    await waitFor(() => expect(result.current.data).toBe('mainnet-page-1'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('does not surface the previous network data after a network switch', async () => {
    const { result } = renderNetworkScopedQuery()
    await waitFor(() => expect(result.current.data).toBe('mainnet-page-0'))

    switchNetwork(NetworkName.TESTNET)

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.data).toBe('testnet-page-0'))
  })

  it('does not surface the previous network data when switching away from a later page', async () => {
    const { result, rerender } = renderNetworkScopedQuery()
    await waitFor(() => expect(result.current.data).toBe('mainnet-page-0'))

    rerender({ page: 1 })
    await waitFor(() => expect(result.current.data).toBe('mainnet-page-1'))

    switchNetwork(NetworkName.TESTNET)

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)
  })

  it('serves cached data without a placeholder when switching back to a warm network', async () => {
    const { result } = renderNetworkScopedQuery()
    await waitFor(() => expect(result.current.data).toBe('mainnet-page-0'))

    switchNetwork(NetworkName.TESTNET)
    await waitFor(() => expect(result.current.data).toBe('testnet-page-0'))

    switchNetwork(NetworkName.MAINNET)

    expect(result.current.data).toBe('mainnet-page-0')
    expect(result.current.isPlaceholderData).toBe(false)
  })
})
