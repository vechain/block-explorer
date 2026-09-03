import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeQueryClient } from '@/lib/query-client/query-client'
import type { BlockBeat, PendingTx } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'
import { LiveHeadProvider, useLiveHead } from './provider'

let onBlock: (block: BlockBeat) => void
let onTx: (tx: PendingTx) => void
let indexed: IndexerBlock[] | undefined
let seeded: IndexerBlock[] | undefined

vi.mock('@/services/thor/subscriptions', () => ({
  useBlockSubscription: (cb: typeof onBlock) => {
    onBlock = cb
    return true
  },
  useTxPoolSubscription: (cb: typeof onTx) => {
    onTx = cb
  },
}))

vi.mock('@/services/veworld-indexer/latest-blocks', () => ({
  liveBlocksQueryKey: (network: string) => ['getLatestBlocks', 'live', network],
  useLatestBlocksLive: () => ({ data: indexed ? { data: indexed } : undefined }),
  useLatestBlocks: () => ({ data: seeded ? { pages: [{ data: seeded }] } : undefined }),
}))

const hex = (seed: string, length = 64): `0x${string}` => `0x${seed.repeat(length)}`

const beat = (number: number, txs: `0x${string}`[]): BlockBeat => ({
  number,
  id: hex(String(number % 10)),
  parentID: hex('b'),
  timestamp: number * 10_000,
  size: 400,
  transactions: txs,
  gasUsed: 21_000n,
  gasLimit: 40_000_000n,
  signer: hex('c', 40),
  beneficiary: hex('d', 40),
  txsRoot: hex('e'),
  stateRoot: hex('f'),
  receiptsRoot: hex('3'),
  totalScore: number,
  com: true,
  obsolete: false,
})

const indexerBlock = (number: number, txs: `0x${string}`[] = []): IndexerBlock =>
  ({ ...beat(number, txs), clauseCount: txs.length, totalVthoPaid: 1_000n }) as unknown as IndexerBlock

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={makeQueryClient()}>
    <LiveHeadProvider>{children}</LiveHeadProvider>
  </QueryClientProvider>
)

afterEach(() => {
  indexed = undefined
  seeded = undefined
})

describe('LiveHeadProvider', () => {
  it('holds the beat until the index serves the announced block', () => {
    const { result, rerender, unmount } = renderHook(() => useLiveHead(), { wrapper })

    act(() => {
      onTx({ id: hex('1') })
      onTx({ id: hex('2') })
    })
    act(() => onBlock(beat(100, [hex('1')])))
    expect(result.current.head).toBeUndefined()
    expect(result.current.announced?.number).toBe(100)
    expect(result.current.pending).toBe(2)
    expect(result.current.live).toBe(true)

    indexed = [indexerBlock(100, [hex('1')])]
    rerender()
    expect(result.current.head).toMatchObject({ number: 100, clauseCount: 1 })
    expect(result.current.announced).toBeUndefined()
    expect(result.current.pending).toBe(1)
    unmount()
  })

  it('runs off the index alone when the socket has nothing to say', () => {
    indexed = [indexerBlock(200), indexerBlock(199)]
    seeded = [indexerBlock(200), indexerBlock(199), indexerBlock(198)]
    const { result } = renderHook(() => useLiveHead(), { wrapper })

    expect(result.current.head).toMatchObject({ number: 200 })
    expect(result.current.history.map(point => point.number)).toEqual([198, 199, 200])
  })

  it('refuses to run without the provider', () => {
    expect(() => renderHook(() => useLiveHead())).toThrow(/LiveHeadProvider/)
  })
})
