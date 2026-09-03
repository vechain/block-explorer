import type { BlockBeat, PendingTx } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'

export type LiveBlock = IndexerBlock & {
  /** Wall-clock ms when the index served this block; the dial sweeps from here. */
  seenAt: number
}

/** A block the node has sealed that the index has not served yet. */
export type AnnouncedBlock = Pick<BlockBeat, 'number' | 'timestamp' | 'transactions'>

/** Gas used against the limit for one block, oldest first in `history`. */
export type UsagePoint = { number: number; gasUsed: number; gasLimit: number }

export type LiveHeadSnapshot = {
  head: LiveBlock | undefined
  announced: AnnouncedBlock | undefined
  history: UsagePoint[]
  /** Transactions the node has admitted to its pool that no served block has included yet. */
  pending: number
}

// A pooled transaction that two beats fail to include is presumed dropped.
const PENDING_BEATS = 2
export const HISTORY_BLOCKS = 90

const mergeHistory = (history: UsagePoint[], blocks: IndexerBlock[]): UsagePoint[] => {
  const byNumber = new Map(history.map(point => [point.number, point]))
  for (const block of blocks) {
    byNumber.set(block.number, {
      number: block.number,
      gasUsed: Number(block.gasUsed),
      gasLimit: Number(block.gasLimit),
    })
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number).slice(-HISTORY_BLOCKS)
}

export const createLiveHeadStore = (now: () => number = Date.now) => {
  let snapshot: LiveHeadSnapshot = { head: undefined, announced: undefined, history: [], pending: 0 }
  const pendingBeats = new Map<string, number>()
  const listeners = new Set<() => void>()

  const emit = (next: LiveHeadSnapshot) => {
    snapshot = next
    listeners.forEach(listener => listener())
  }

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => snapshot,

    onBlock: ({ obsolete, number, timestamp, transactions }: BlockBeat) => {
      const { head, announced } = snapshot
      if (obsolete || (head && head.number >= number) || (announced && announced.number >= number)) return
      emit({ ...snapshot, announced: { number, timestamp, transactions } })
    },

    onPendingTx: (tx: PendingTx) => {
      if (pendingBeats.has(tx.id)) return
      pendingBeats.set(tx.id, 0)
      emit({ ...snapshot, pending: pendingBeats.size })
    },

    onIndexed: (blocks: IndexerBlock[] | undefined) => {
      const newest = blocks?.[0]
      if (!blocks || !newest) return
      const history = mergeHistory(snapshot.history, blocks)
      const { head, announced } = snapshot
      if (head && head.number >= newest.number) {
        if (history.length !== snapshot.history.length) emit({ ...snapshot, history })
        return
      }

      const sealed = announced?.number === newest.number ? announced.transactions : newest.transactions
      for (const id of sealed) pendingBeats.delete(id)
      for (const [id, beats] of pendingBeats) {
        if (beats + 1 >= PENDING_BEATS) pendingBeats.delete(id)
        else pendingBeats.set(id, beats + 1)
      }

      emit({
        head: { ...newest, seenAt: now() },
        announced: announced && announced.number > newest.number ? announced : undefined,
        history,
        pending: pendingBeats.size,
      })
    },
  }
}
