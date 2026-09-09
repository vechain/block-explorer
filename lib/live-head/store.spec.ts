import { describe, expect, it, vi } from 'vitest'
import type { BlockBeat } from '@/services/thor/subscriptions'
import type { PoolStatus } from '@/services/thor/transaction'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'
import { HISTORY_BLOCKS, type LiveHeadStoreOptions, createLiveHeadStore } from './store'

const hex = (seed: string, length = 64): `0x${string}` => `0x${seed.repeat(length)}`

const makeStore = (options: Partial<LiveHeadStoreOptions> = {}) =>
  createLiveHeadStore({ probe: async () => 'pending', sealedIn: async () => [], ...options })

const txId = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, '0')}`

const settled = () => new Promise(resolve => setTimeout(resolve, 0))

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
    const store = makeStore()
    store.onBlock(beat(100, [hex('1')]))

    expect(store.getSnapshot().head).toBeUndefined()
    expect(store.getSnapshot().announced).toMatchObject({ number: 100, timestamp: 1_000_000 })
  })

  it('ignores orphaned announcements and anything not ahead of what it knows', () => {
    const store = makeStore()
    store.onIndexed([indexed(100)])
    store.onBlock(beat(101, [], true))
    store.onBlock(beat(100, []))
    expect(store.getSnapshot().announced).toBeUndefined()

    store.onBlock(beat(102, []))
    store.onBlock(beat(101, []))
    expect(store.getSnapshot().announced?.number).toBe(102)
  })

  it('beats when the index serves the block, dropping only the pooled transactions it included', () => {
    const store = makeStore({ now: () => 42 })
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('2') })
    store.onPendingTx({ id: hex('3') })
    expect(store.getSnapshot().pending).toBe(3)

    store.onBlock(beat(100, [hex('1'), hex('2')]))
    expect(store.getSnapshot().pending).toBe(3)

    store.onIndexed([indexed(100, [hex('1'), hex('2')])])
    const { head, announced, pending, pool, fates } = store.getSnapshot()
    expect(head).toMatchObject({ number: 100, seenAt: 42, clauseCount: 2 })
    expect(announced).toBeUndefined()
    expect(pending).toBe(1)
    expect(pool).toEqual([hex('3')])
    expect([...fates]).toEqual([
      [hex('1'), 'mined'],
      [hex('2'), 'mined'],
    ])
  })

  it('removes the pooled transactions of every block the index serves at once', () => {
    const store = makeStore()
    store.onIndexed([indexed(100)])
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('2') })
    store.onPendingTx({ id: hex('3') })

    store.onIndexed([indexed(102, [hex('2')]), indexed(101, [hex('1')]), indexed(100)])
    expect(store.getSnapshot().head?.number).toBe(102)
    expect(store.getSnapshot().pending).toBe(1)
  })

  it('fetches the transactions of the blocks a page skipped over instead of probing them', async () => {
    const sealedIn = vi.fn(async (numbers: number[]) =>
      numbers.map(n => (n === 101 ? [hex('1')] : n === 103 ? [hex('2')] : [])),
    )
    const probe = vi.fn<(id: `0x${string}`) => Promise<PoolStatus>>(async () => 'mined')
    const store = makeStore({ sealedIn, probe })
    store.onIndexed([indexed(100)])
    store.onPendingTx({ id: hex('1') })
    store.onPendingTx({ id: hex('2') })
    store.onPendingTx({ id: hex('3') })

    store.onIndexed([indexed(108, [hex('3')]), indexed(107), indexed(106), indexed(105), indexed(104)])
    expect(sealedIn).toHaveBeenCalledWith([101, 102, 103])
    expect(store.getSnapshot().pending).toBe(2)

    await settled()
    expect(store.getSnapshot().pending).toBe(0)
    expect(probe).not.toHaveBeenCalled()
  })

  it('probes the skipped blocks’ transactions when they cannot be fetched', async () => {
    const store = makeStore({ sealedIn: async () => Promise.reject(new Error('offline')), probe: async () => 'mined' })
    store.onIndexed([indexed(100)])
    store.onPendingTx({ id: hex('1') })
    store.onIndexed([indexed(110)])
    await settled()
    expect(store.getSnapshot().pending).toBe(0)
  })

  it('starts the pool over when a page skips more blocks than it can fill', () => {
    const sealedIn = vi.fn(async () => [])
    const store = makeStore({ sealedIn })
    store.onIndexed([indexed(100)])
    store.onPendingTx({ id: hex('1') })
    store.onIndexed([indexed(140)])
    expect(store.getSnapshot().pending).toBe(0)
    expect(sealedIn).not.toHaveBeenCalled()
  })

  it('rotates probes so transactions the node keeps holding do not starve the rest', async () => {
    const probe = vi.fn<(id: `0x${string}`) => Promise<PoolStatus>>(async () => 'pending')
    const store = makeStore({ probe })
    for (let n = 1; n <= 40; n++) store.onPendingTx({ id: txId(n) })
    store.onIndexed([indexed(1)])
    store.onIndexed([indexed(2)])
    await settled()
    expect(probe).toHaveBeenCalledTimes(32)

    store.onIndexed([indexed(3)])
    await settled()
    const secondBeat = probe.mock.calls.slice(32).map(([id]) => id)
    expect(secondBeat.slice(0, 8)).toEqual([33, 34, 35, 36, 37, 38, 39, 40].map(txId))
  })

  it('asks the node about a transaction two beats fail to include and keeps it while the node holds it', async () => {
    const probe = vi.fn<(id: `0x${string}`) => Promise<PoolStatus>>(async () => 'pending')
    const store = makeStore({ probe })
    store.onPendingTx({ id: hex('9') })
    store.onIndexed([indexed(1)])
    expect(probe).not.toHaveBeenCalled()

    store.onIndexed([indexed(2)])
    await settled()
    expect(probe).toHaveBeenCalledWith(hex('9'))
    expect(store.getSnapshot().pending).toBe(1)

    store.onIndexed([indexed(3)])
    await settled()
    expect(probe).toHaveBeenCalledTimes(2)
  })

  it.each<PoolStatus>(['gone', 'mined'])('drops a lingering transaction the node reports %s', async status => {
    const store = makeStore({ probe: async () => status })
    let notified = 0
    store.subscribe(() => notified++)
    store.onPendingTx({ id: hex('9') })
    store.onIndexed([indexed(1)])
    store.onIndexed([indexed(2)])
    expect(store.getSnapshot().pending).toBe(1)

    await settled()
    expect(store.getSnapshot().pending).toBe(0)
    expect(store.getSnapshot().fates.get(hex('9'))).toBe(status === 'gone' ? 'dropped' : 'mined')
    expect(notified).toBe(4)
  })

  it('forgets the oldest fates once it holds more than it keeps', () => {
    const store = makeStore()
    store.onIndexed([indexed(1)])
    for (let n = 1; n <= 300; n++) store.onPendingTx({ id: txId(n) })
    store.onIndexed([
      indexed(
        2,
        Array.from({ length: 300 }, (_, i) => txId(i + 1)),
      ),
    ])
    const { fates } = store.getSnapshot()
    expect(fates.size).toBe(256)
    expect(fates.has(txId(44))).toBe(false)
    expect(fates.has(txId(45))).toBe(true)
  })

  it('keeps counting when the node cannot be asked', async () => {
    const store = makeStore({ probe: async () => Promise.reject(new Error('offline')) })
    store.onPendingTx({ id: hex('9') })
    store.onIndexed([indexed(1)])
    store.onIndexed([indexed(2)])
    await settled()
    expect(store.getSnapshot().pending).toBe(1)
  })

  it('does not re-announce a transaction a block included while the node was being asked', async () => {
    let answer: (status: PoolStatus) => void = () => undefined
    const store = makeStore({ probe: () => new Promise(resolve => (answer = resolve)) })
    let notified = 0
    store.onPendingTx({ id: hex('9') })
    store.onIndexed([indexed(1)])
    store.onIndexed([indexed(2)])
    store.onIndexed([indexed(3, [hex('9')])])
    expect(store.getSnapshot().pending).toBe(0)

    store.subscribe(() => notified++)
    answer('gone')
    await settled()
    expect(notified).toBe(0)
  })

  it('keeps an announcement the index has not reached yet', () => {
    const store = makeStore()
    store.onBlock(beat(101, []))
    store.onIndexed([indexed(100)])
    expect(store.getSnapshot().head?.number).toBe(100)
    expect(store.getSnapshot().announced?.number).toBe(101)
  })

  it('does not rewind the head to an older served block', () => {
    const store = makeStore()
    store.onIndexed([indexed(100)])
    store.onIndexed([indexed(99)])
    expect(store.getSnapshot().head?.number).toBe(100)
  })

  it('accumulates gas usage per block, oldest first, without duplicates or rewinding the head', () => {
    const store = makeStore()
    store.onIndexed([indexed(102), indexed(101), indexed(100)])
    store.onIndexed([indexed(103), indexed(102)])
    store.onIndexed([indexed(99)])
    expect(store.getSnapshot().head?.number).toBe(103)
    expect(store.getSnapshot().history.map(point => point.number)).toEqual([99, 100, 101, 102, 103])
    expect(store.getSnapshot().history[0]).toMatchObject({ gasUsed: 21_000, gasLimit: 40_000_000 })
  })

  it('keeps the history to the newest blocks', () => {
    const store = makeStore()
    for (let n = 1; n <= HISTORY_BLOCKS + 10; n++) store.onIndexed([indexed(n)])
    const { history } = store.getSnapshot()
    expect(history).toHaveLength(HISTORY_BLOCKS)
    expect(history.at(-1)?.number).toBe(HISTORY_BLOCKS + 10)
  })

  it('notifies subscribers on every change and stops after unsubscribe', () => {
    const store = makeStore()
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    store.onBlock(beat(1, []))
    store.onPendingTx({ id: hex('1') })
    unsubscribe()
    store.onPendingTx({ id: hex('2') })
    expect(calls).toBe(2)
  })
})
