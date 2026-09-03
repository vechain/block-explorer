import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BlockBeat, PendingTx } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'
import { useBlockClockFeed } from './useBlockClockFeed'

let onBlock: (block: BlockBeat) => void
let onTx: (tx: PendingTx) => void
let indexed: IndexerBlock | undefined

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
  useLatestBlocksLive: () => ({ data: indexed ? { data: [indexed] } : undefined }),
}))

const hex = (seed: string, length = 64): `0x${string}` => `0x${seed.repeat(length)}`

const beat = (number: number, txs: number, obsolete = false): BlockBeat => ({
  number,
  id: hex('a'),
  parentID: hex('b'),
  timestamp: number * 10_000,
  signer: hex('c', 40),
  transactions: Array.from({ length: txs }, (_, i) => hex(String(i))),
  obsolete,
})

const indexerBlock = (number: number, clauseCount: number): IndexerBlock =>
  ({
    number,
    timestamp: number * 10_000,
    transactions: [hex('1'), hex('2')],
    clauseCount,
    totalVthoPaid: 1_000n,
  }) as unknown as IndexerBlock

afterEach(() => {
  indexed = undefined
})

describe('useBlockClockFeed', () => {
  it('takes the head from the node socket and clears the pending count at the seal', () => {
    const { result } = renderHook(() => useBlockClockFeed())

    act(() => {
      onTx({ id: hex('1') })
      onTx({ id: hex('1') })
      onTx({ id: hex('2') })
    })
    expect(result.current.pending).toBe(2)

    act(() => onBlock(beat(100, 3)))
    expect(result.current.head).toMatchObject({ number: 100, txCount: 3 })
    expect(result.current.head?.clauseCount).toBeUndefined()
    expect(result.current.pending).toBe(0)
    expect(result.current.live).toBe(true)
  })

  it('ignores orphaned blocks and anything behind the current head', () => {
    const { result } = renderHook(() => useBlockClockFeed())

    act(() => onBlock(beat(100, 3)))
    act(() => onBlock(beat(101, 1, true)))
    act(() => onBlock(beat(99, 5)))

    expect(result.current.head?.number).toBe(100)
  })

  it('fills the clause and VTHO totals in from the index once it reaches the same block', () => {
    const { result, rerender } = renderHook(() => useBlockClockFeed())
    act(() => onBlock(beat(100, 3)))

    indexed = indexerBlock(99, 7)
    rerender()
    expect(result.current.head?.number).toBe(100)
    expect(result.current.head?.clauseCount).toBeUndefined()

    indexed = indexerBlock(100, 9)
    rerender()
    expect(result.current.head).toMatchObject({ number: 100, txCount: 3, clauseCount: 9, totalVthoPaid: 1_000n })
  })

  it('runs off the index alone when the socket has nothing to say', () => {
    indexed = indexerBlock(200, 4)
    const { result } = renderHook(() => useBlockClockFeed())

    expect(result.current.head).toMatchObject({ number: 200, txCount: 2, clauseCount: 4 })
  })
})
