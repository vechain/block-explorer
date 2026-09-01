import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NETWORK } from '@/lib/constants/network'
import { makeQueryClient } from '@/lib/query-client/query-client'
import { useSettingsStore } from '@/lib/stores/settings'
import { indexerFetch } from '.'
import { indexerBlockSchema } from './schemas'

vi.mock('.', async importOriginal => ({
  ...(await importOriginal<typeof import('.')>()),
  indexerFetch: vi.fn(),
}))

// Stands in for the Thor fan-out, so the join is tested without an expanded-block fixture.
const expandedRevisions: number[] = []
let holdExpanded = false
let expandedResolvers: Array<() => void>

vi.mock('@/services/thor/block', () => ({
  blockExpandedQueryOptions: (networkName: string, revision: number) => ({
    queryKey: ['blockExpanded', networkName, revision],
    queryFn: () => {
      expandedRevisions.push(revision)
      const block = {
        number: revision,
        transactions: [
          { clauses: [{}, {}], paid: 1_000n },
          { clauses: [{}], paid: 500n },
        ],
      }
      if (holdExpanded) return new Promise(resolve => expandedResolvers.push(() => resolve(block)))
      return Promise.resolve(block)
    },
    staleTime: Infinity,
  }),
}))

const { useBlockDetails, useLatestBlocks } = await import('./latest-blocks')

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

beforeEach(() => {
  expandedRevisions.length = 0
  expandedResolvers = []
  holdExpanded = false
})

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
})

describe('useBlockDetails', () => {
  const blocks = [100, 99].map(number => indexerBlockSchema.parse(indexedBlock(number)))

  it('asks Thor only for the blocks it was given', async () => {
    render(() => useBlockDetails(blocks))

    await waitFor(() => expect(expandedRevisions).toHaveLength(2))
    expect([...expandedRevisions].sort((a, b) => a - b)).toEqual([99, 100])
  })

  it('joins clause counts and VTHO paid onto the indexed headers', async () => {
    const { result } = render(() => useBlockDetails(blocks))

    await waitFor(() =>
      expect(result.current.map(block => [block.number, block.clauseCount, block.vthoPaid])).toEqual([
        [100, 3, 1_500n],
        [99, 3, 1_500n],
      ]),
    )
  })

  it('renders the indexed header before the Thor detail lands', async () => {
    holdExpanded = true
    const { result } = render(() => useBlockDetails(blocks))

    await waitFor(() => expect(expandedResolvers).toHaveLength(2))
    expect(result.current.map(block => block.number)).toEqual([100, 99])
    expect(result.current.every(block => block.clauseCount === undefined)).toBe(true)

    holdExpanded = false
    await act(async () => {
      expandedResolvers.forEach(resolve => resolve())
    })

    await waitFor(() => expect(result.current.every(block => block.clauseCount === 3)).toBe(true))
  })
})
