import type { ExpandedBlock } from '@/lib/schemas'
import type { BlockBeat, PendingTx } from '@/services/thor/subscriptions'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'

export type BlockTotals = { clauseCount: number; totalVthoPaid: bigint }
/** A block header as the node announced it; the totals land a moment later, from the node or the index. */
export type AnnouncedBlock = Omit<IndexerBlock, keyof BlockTotals> & Partial<BlockTotals>
export type LiveBlock = AnnouncedBlock & {
  /** Wall-clock ms when this client first learned of the block; the dial sweeps from here. */
  seenAt: number
}

export type LiveHeadSnapshot = {
  head: LiveBlock | undefined
  /** Newest first, capped; the rows the index has not caught up with yet. */
  recent: LiveBlock[]
  /** Transactions the node has admitted to its pool since the head was sealed. */
  pending: number
}

const RECENT_CAP = 5

export const totalsOf = (block: ExpandedBlock): BlockTotals => ({
  clauseCount: block.transactions.reduce((count, tx) => count + tx.clauses.length, 0),
  totalVthoPaid: block.transactions.reduce((sum, tx) => sum + tx.paid, 0n),
})

/** The indexer's list with any announced blocks it has not reached yet stacked on top. */
export const mergeLiveBlocks = <T extends { number: number }>(
  recent: LiveBlock[],
  indexed: T[],
): Array<LiveBlock | T> => {
  const newest = indexed[0]?.number ?? -1
  return [...recent.filter(block => block.number > newest), ...indexed]
}

export const createLiveHeadStore = (now: () => number = Date.now) => {
  let snapshot: LiveHeadSnapshot = { head: undefined, recent: [], pending: 0 }
  const pendingIds = new Set<string>()
  const listeners = new Set<() => void>()

  const emit = (next: LiveHeadSnapshot) => {
    snapshot = next
    listeners.forEach(listener => listener())
  }

  const publish = (block: LiveBlock) => {
    pendingIds.clear()
    const recent = [block, ...snapshot.recent.filter(other => other.number !== block.number)]
      .sort((a, b) => b.number - a.number)
      .slice(0, RECENT_CAP)
    emit({ head: block, recent, pending: 0 })
  }

  const onTotals = (number: number, totals: BlockTotals) => {
    if (!snapshot.recent.some(block => block.number === number && block.clauseCount === undefined)) return
    const recent = snapshot.recent.map(block => (block.number === number ? { ...block, ...totals } : block))
    emit({ ...snapshot, recent, head: recent.find(block => block.number === snapshot.head?.number) })
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
      const { obsolete: _obsolete, ...header } = block
      publish({ ...header, seenAt: now() })
    },

    onPendingTx: (tx: PendingTx) => {
      if (pendingIds.has(tx.id)) return
      pendingIds.add(tx.id)
      emit({ ...snapshot, pending: pendingIds.size })
    },

    onTotals,

    onIndexed: (blocks: IndexerBlock[] | undefined) => {
      const newest = blocks?.[0]
      if (!blocks || !newest) return
      const { head } = snapshot
      if (!head || newest.number > head.number) publish({ ...newest, seenAt: now() })
      for (const block of blocks) {
        onTotals(block.number, { clauseCount: block.clauseCount, totalVthoPaid: block.totalVthoPaid })
      }
    },
  }
}
