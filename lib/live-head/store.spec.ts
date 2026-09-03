import { describe, expect, it } from 'vitest'
import type { BlockBeat } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'
import { HISTORY_BLOCKS, createLiveHeadStore } from './store'

const hex = (seed: string, length = 64): `0x${string}` => `0x${seed.repeat(length)}`

const header = (number: number, txs: `0x${string}`[]) => ({
  number,
  id: hex(number.toString(16).slice(-1)),
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
})

const beat = (number: number, txs: `0x${string}`[], obsolete = false): BlockBeat => ({
  ...header(number, txs),
  obsolete,
})

const indexed = (number: number, txs: `0x${string}`[] = []): IndexerBlock => ({
  ...header(number, txs),
  clauseCount: txs.length,
  totalVthoPaid: 10n,
})

describe('createLiveHeadStore', () => {
  it('records an announced block without moving the head', () => {
    const store = createLiveHeadStore()
    store.onBlock(beat(100, [hex('1')]))

    expect(store.getSnapshot().head).toBeUndefined()
    expect(store.getSnapshot().announced).toMatchObject({ number: 100, timestamp: 1_000_000 })
  })

  it('ignores orphaned announcements and anything not ahead of what it knows', () => {
    const store = createLiveHeadStore()
    store.onIndexed([indexed(100)])
    store.onBlock(beat(101, [], true))
    store.onBlock(beat(100, []))
    expect(store.getSnapshot().announced).toBeUndefined()

    store.onBlock(beat(102, []))
    store.onBlock(beat(101, []))
    expect(store.getSnapshot().announced?.number).toBe(102)
  })

  it('beats when the index serves the block, dropping only the pooled transactions it included', () => {
    const store = createLiveHeadStore(() => 42)
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('2') })
    store.onPendingTx({ id: hex('3') })
    expect(store.getSnapshot().pending).toBe(3)

    store.onBlock(beat(100, [hex('1'), hex('2')]))
    expect(store.getSnapshot().pending).toBe(3)

    store.onIndexed([indexed(100, [hex('1'), hex('2')])])
    const { head, announced, pending } = store.getSnapshot()
    expect(head).toMatchObject({ number: 100, seenAt: 42, clauseCount: 2 })
    expect(announced).toBeUndefined()
    expect(pending).toBe(1)
  })

  it('presumes a pooled transaction dropped after two beats without it', () => {
    const store = createLiveHeadStore()
    store.onPendingTx({ id: hex('9') })
    store.onIndexed([indexed(1)])
    expect(store.getSnapshot().pending).toBe(1)
    store.onIndexed([indexed(2)])
    expect(store.getSnapshot().pending).toBe(0)
  })

  it('keeps an announcement the index has not reached yet', () => {
    const store = createLiveHeadStore()
    store.onBlock(beat(101, []))
    store.onIndexed([indexed(100)])
    expect(store.getSnapshot().head?.number).toBe(100)
    expect(store.getSnapshot().announced?.number).toBe(101)
  })

  it('does not rewind the head to an older served block', () => {
    const store = createLiveHeadStore()
    store.onIndexed([indexed(100)])
    store.onIndexed([indexed(99)])
    expect(store.getSnapshot().head?.number).toBe(100)
  })

  it('accumulates gas usage per block, oldest first, without duplicates or rewinding the head', () => {
    const store = createLiveHeadStore()
    store.onIndexed([indexed(102), indexed(101), indexed(100)])
    store.onIndexed([indexed(103), indexed(102)])
    store.onIndexed([indexed(99)])
    expect(store.getSnapshot().head?.number).toBe(103)
    expect(store.getSnapshot().history.map(point => point.number)).toEqual([99, 100, 101, 102, 103])
    expect(store.getSnapshot().history[0]).toMatchObject({ gasUsed: 21_000, gasLimit: 40_000_000 })
  })

  it('keeps the history to the newest blocks', () => {
    const store = createLiveHeadStore()
    for (let n = 1; n <= HISTORY_BLOCKS + 10; n++) store.onIndexed([indexed(n)])
    const { history } = store.getSnapshot()
    expect(history).toHaveLength(HISTORY_BLOCKS)
    expect(history.at(-1)?.number).toBe(HISTORY_BLOCKS + 10)
  })

  it('notifies subscribers on every change and stops after unsubscribe', () => {
    const store = createLiveHeadStore()
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    store.onBlock(beat(1, []))
    store.onPendingTx({ id: hex('1') })
    unsubscribe()
    store.onPendingTx({ id: hex('2') })
    expect(calls).toBe(2)
  })
})
