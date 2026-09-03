import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ExpandedBlock } from '@/lib/schemas'
import type { BlockBeat, PendingTx } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'
import { LiveHeadProvider, useLiveHead } from './provider'

let onBlock: (block: BlockBeat) => void
let onTx: (tx: PendingTx) => void
let indexed: IndexerBlock[] | undefined
let expanded: ExpandedBlock | undefined
const expandedRequests: unknown[] = []

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
  useLatestBlocksLive: () => ({ data: indexed ? { data: indexed } : undefined }),
}))

vi.mock('@/services/thor/block', () => ({
  useBlockExpanded: (revision: unknown) => {
    expandedRequests.push(revision)
    return { data: revision === undefined ? undefined : expanded }
  },
}))

const hex = (seed: string, length = 64): `0x${string}` => `0x${seed.repeat(length)}`

const beat = (number: number, txs: number): BlockBeat => ({
  number,
  id: hex(String(number % 10)),
  parentID: hex('b'),
  timestamp: number * 10_000,
  size: 400,
  transactions: Array.from({ length: txs }, (_, i) => hex(String(i))),
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

const indexerBlock = (number: number, clauseCount: number): IndexerBlock =>
  ({ ...beat(number, 2), clauseCount, totalVthoPaid: 1_000n }) as unknown as IndexerBlock

const wrapper = ({ children }: { children: ReactNode }) => <LiveHeadProvider>{children}</LiveHeadProvider>

afterEach(() => {
  indexed = undefined
  expanded = undefined
  expandedRequests.length = 0
})

describe('LiveHeadProvider', () => {
  it('seals off the socket, then takes the totals from the node before the index has the block', () => {
    const { result, rerender } = renderHook(() => useLiveHead(), { wrapper })

    act(() => {
      onTx({ id: hex('1') })
      onTx({ id: hex('2') })
    })
    expect(result.current.pending).toBe(2)

    act(() => onBlock(beat(100, 3)))
    expect(result.current.head).toMatchObject({ number: 100 })
    expect(result.current.pending).toBe(0)
    expect(result.current.live).toBe(true)
    expect(expandedRequests.at(-1)).toBe(beat(100, 3).id)

    expanded = { number: 100, transactions: [{ clauses: [{}, {}], paid: 5n }] } as unknown as ExpandedBlock
    rerender()
    expect(result.current.head).toMatchObject({ number: 100, clauseCount: 2, totalVthoPaid: 5n })
    expect(expandedRequests.at(-1)).toBeUndefined()
  })

  it('runs off the index alone when the socket has nothing to say', () => {
    indexed = [indexerBlock(200, 4), indexerBlock(199, 3)]
    const { result } = renderHook(() => useLiveHead(), { wrapper })

    expect(result.current.head).toMatchObject({ number: 200, clauseCount: 4 })
    expect(result.current.recent.map(block => block.number)).toEqual([200])
  })

  it('refuses to run without the provider', () => {
    expect(() => renderHook(() => useLiveHead())).toThrow(/LiveHeadProvider/)
  })
})
