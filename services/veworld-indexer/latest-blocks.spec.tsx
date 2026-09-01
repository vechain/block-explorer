import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NETWORK } from '@/lib/constants/network'
import { makeQueryClient } from '@/lib/query-client/query-client'
import { useSettingsStore } from '@/lib/stores/settings'
import { indexerFetch } from '.'
import { useLatestBlocks } from './latest-blocks'

vi.mock('.', async importOriginal => ({
  ...(await importOriginal<typeof import('.')>()),
  indexerFetch: vi.fn(),
}))

const mockIndexerFetch = vi.mocked(indexerFetch)

const hex = (length: number, seed: string) => `0x${seed.repeat(length)}`

const indexedBlock = (number: number) => ({
  number,
  id: hex(64, 'a'),
  parentID: hex(64, 'b'),
  timestamp: 1_700_000_000,
  size: 361,
  transactions: [hex(64, '1'), hex(64, '2')],
  txsFeatures: 1,
  gasUsed: 21_000,
  gasLimit: 40_000_000,
  baseFeePerGas: '0x9184e72a000',
  signer: hex(40, 'c'),
  beneficiary: hex(40, 'd'),
  txsRoot: hex(64, 'e'),
  stateRoot: hex(64, 'f'),
  receiptsRoot: hex(64, '3'),
  totalScore: number,
  com: true,
  clauseCount: 12,
  totalVthoPaid: '0x2f1c59f8e6aefae0',
})

const page = (numbers: number[], cursor?: string) =>
  ({ data: { data: numbers.map(indexedBlock), pagination: { hasNext: Boolean(cursor), cursor } } }) as Awaited<
    ReturnType<typeof indexerFetch>
  >

const render = <T,>(hook: () => T) => {
  const queryClient = makeQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(hook, { wrapper })
}

const paramsOf = (call: number) => mockIndexerFetch.mock.calls[call][0].params

afterEach(() => {
  useSettingsStore.setState({ activeNetwork: DEFAULT_NETWORK })
  vi.clearAllMocks()
})

describe('useLatestBlocks', () => {
  it('walks back from the head with the cursor the previous page returned', async () => {
    mockIndexerFetch.mockResolvedValueOnce(page([100, 99], '98')).mockResolvedValueOnce(page([98, 97], '96'))
    const { result } = render(() => useLatestBlocks({ size: 2 }))

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1))
    expect(paramsOf(0)).toEqual({ size: '2' })

    await act(async () => {
      await result.current.fetchNextPage()
    })

    expect(paramsOf(1)).toEqual({ size: '2', from: '98' })
    await waitFor(() =>
      expect(result.current.data?.pages.flatMap(p => p.data.map(b => b.number))).toEqual([100, 99, 98, 97]),
    )
  })

  it('stops paginating once the index reports no more blocks', async () => {
    mockIndexerFetch.mockResolvedValue(page([100, 99]))
    const { result } = render(() => useLatestBlocks({ size: 2 }))

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('carries the per-block clause and VTHO totals off the response', async () => {
    mockIndexerFetch.mockResolvedValue(page([100]))
    const { result } = render(() => useLatestBlocks({ size: 2 }))

    await waitFor(() => expect(result.current.data?.pages[0].data).toHaveLength(1))
    const [block] = result.current.data!.pages[0].data
    expect(block.clauseCount).toBe(12)
    expect(block.totalVthoPaid).toBe(3_394_687_144_687_500_000n)
  })
})
