import type { BlockBeat, PendingTx } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'

export type ClockHead = {
  number: number
  timestamp: number
  txCount: number
  /** Wall-clock ms when this client first learned of the block; the dial sweeps from here. */
  seenAt: number
  clauseCount?: number
  totalVthoPaid?: bigint
}

export type ClockSnapshot = {
  head: ClockHead | undefined
  /** Transactions the node has admitted to its pool since the head was sealed. */
  pending: number
}

const fromIndexed = (block: IndexerBlock, seenAt: number): ClockHead => ({
  number: block.number,
  timestamp: block.timestamp,
  txCount: block.transactions.length,
  seenAt,
  clauseCount: block.clauseCount,
  totalVthoPaid: block.totalVthoPaid,
})

// The socket wins on timing; the index fills in the totals later and carries the feed when the socket is down.
export const createBlockClockStore = (now: () => number = Date.now) => {
  let snapshot: ClockSnapshot = { head: undefined, pending: 0 }
  const pendingIds = new Set<string>()
  const listeners = new Set<() => void>()

  const emit = (next: ClockSnapshot) => {
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

    onBlock: (block: BlockBeat) => {
      const { head } = snapshot
      if (block.obsolete || (head && head.number >= block.number)) return
      pendingIds.clear()
      emit({
        head: { number: block.number, timestamp: block.timestamp, txCount: block.transactions.length, seenAt: now() },
        pending: 0,
      })
    },

    onPendingTx: (tx: PendingTx) => {
      if (pendingIds.has(tx.id)) return
      pendingIds.add(tx.id)
      emit({ ...snapshot, pending: pendingIds.size })
    },

    onIndexed: (block: IndexerBlock | undefined) => {
      if (!block) return
      const { head } = snapshot
      if (!head || block.number > head.number) {
        pendingIds.clear()
        emit({ head: fromIndexed(block, now()), pending: 0 })
      } else if (block.number === head.number && head.clauseCount === undefined) {
        emit({ ...snapshot, head: { ...head, clauseCount: block.clauseCount, totalVthoPaid: block.totalVthoPaid } })
      }
    },
  }
}
