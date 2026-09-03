import { describe, expect, it } from 'vitest'
import type { ExpandedBlock } from '@/lib/schemas'
import type { BlockBeat } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'
import { createLiveHeadStore, mergeLiveBlocks, totalsOf } from './store'

const hex = (seed: string, length = 64): `0x${string}` => `0x${seed.repeat(length)}`

const header = (number: number, txs: number) => ({
  number,
  id: hex(number.toString(16).slice(-1)),
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
})

const beat = (number: number, txs: number, obsolete = false): BlockBeat => ({ ...header(number, txs), obsolete })

const indexed = (number: number, clauseCount: number): IndexerBlock => ({
  ...header(number, 2),
  clauseCount,
  totalVthoPaid: BigInt(clauseCount) * 10n,
})

const totals = (clauseCount: number) => ({ clauseCount, totalVthoPaid: BigInt(clauseCount) * 10n })

describe('createLiveHeadStore', () => {
  it('publishes an announced block as the head and clears the pending count', () => {
    const store = createLiveHeadStore(() => 42)
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('2') })
    expect(store.getSnapshot().pending).toBe(2)

    store.onBlock(beat(100, 3))

    const { head, recent, pending } = store.getSnapshot()
    expect(head).toMatchObject({ number: 100, seenAt: 42 })
    expect(head?.transactions).toHaveLength(3)
    expect(head?.clauseCount).toBeUndefined()
    expect(recent.map(b => b.number)).toEqual([100])
    expect(pending).toBe(0)
  })

  it('ignores orphaned blocks and anything behind the head', () => {
    const store = createLiveHeadStore()
    store.onBlock(beat(100, 3))
    store.onBlock(beat(101, 1, true))
    store.onBlock(beat(99, 5))
    expect(store.getSnapshot().head?.number).toBe(100)
  })

  it('keeps the newest five announced blocks', () => {
    const store = createLiveHeadStore()
    for (let n = 1; n <= 7; n++) store.onBlock(beat(n, 1))
    expect(store.getSnapshot().recent.map(b => b.number)).toEqual([7, 6, 5, 4, 3])
  })

  it('attaches totals to the block they belong to, once', () => {
    const store = createLiveHeadStore()
    store.onBlock(beat(100, 3))
    store.onBlock(beat(101, 1))

    store.onTotals(100, totals(9))
    store.onTotals(100, totals(99))
    store.onTotals(555, totals(1))

    const { head, recent } = store.getSnapshot()
    expect(recent.find(b => b.number === 100)).toMatchObject(totals(9))
    expect(head?.clauseCount).toBeUndefined()
  })

  it('lets the index supply the head when nothing was announced, and back-fills totals otherwise', () => {
    const store = createLiveHeadStore(() => 7)
    store.onIndexed([indexed(200, 4), indexed(199, 2)])
    expect(store.getSnapshot().head).toMatchObject({ number: 200, clauseCount: 4, seenAt: 7 })

    store.onBlock(beat(201, 2))
    store.onIndexed([indexed(201, 6), indexed(200, 4)])
    expect(store.getSnapshot().head).toMatchObject({ number: 201, ...totals(6) })
    expect(store.getSnapshot().head?.transactions).toHaveLength(2)
  })

  it('notifies subscribers on every change and stops after unsubscribe', () => {
    const store = createLiveHeadStore()
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    store.onBlock(beat(1, 1))
    store.onPendingTx({ id: hex('1') })
    unsubscribe()
    store.onPendingTx({ id: hex('2') })
    expect(calls).toBe(2)
  })
})

describe('mergeLiveBlocks', () => {
  it('stacks only the announced blocks the index has not reached', () => {
    const store = createLiveHeadStore()
    store.onBlock(beat(10, 1))
    store.onBlock(beat(11, 1))
    store.onBlock(beat(12, 1))

    const merged = mergeLiveBlocks(store.getSnapshot().recent, [indexed(10, 1), indexed(9, 1)])
    expect(merged.map(b => b.number)).toEqual([12, 11, 10, 9])
  })
})

describe('totalsOf', () => {
  it('sums clauses and fees across the expanded block', () => {
    const block = {
      transactions: [
        { clauses: [{}, {}], paid: 5n },
        { clauses: [{}], paid: 7n },
      ],
    } as unknown as ExpandedBlock
    expect(totalsOf(block)).toEqual({ clauseCount: 3, totalVthoPaid: 12n })
  })
})
