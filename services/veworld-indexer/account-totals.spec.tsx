import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NETWORK, NetworkName } from '@/lib/constants/network'
import { makeQueryClient } from '@/lib/query-client/query-client'
import { useSettingsStore } from '@/lib/stores/settings'
import { indexerGet } from '.'
import { useAccountTotal } from './account-totals'

vi.mock('.', async importOriginal => ({
  ...(await importOriginal<typeof import('.')>()),
  indexerGet: vi.fn(),
}))

const mockIndexerGet = vi.mocked(indexerGet)

const TOTALS_BY_NETWORK: Partial<Record<NetworkName, number>> = {
  [NetworkName.MAINNET]: 111,
  [NetworkName.TESTNET]: 222,
}

const renderAccountTotal = () => {
  const queryClient = makeQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return renderHook(() => useAccountTotal(), { wrapper })
}

beforeEach(() => {
  mockIndexerGet.mockImplementation(({ baseUrl }) => {
    const networkName = baseUrl.includes('testnet') ? NetworkName.TESTNET : NetworkName.MAINNET
    return Promise.resolve({ data: TOTALS_BY_NETWORK[networkName] } as Awaited<ReturnType<typeof indexerGet>>)
  })
})

afterEach(() => {
  useSettingsStore.setState({ activeNetwork: DEFAULT_NETWORK })
  vi.clearAllMocks()
})

describe('useAccountTotal', () => {
  it('reports a pending state instead of the previous network total after a network switch', async () => {
    const { result } = renderAccountTotal()
    await waitFor(() => expect(result.current.data).toBe(111))

    act(() => {
      useSettingsStore.getState().setActiveNetwork(NetworkName.TESTNET)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.data).toBe(222))
  })
})
