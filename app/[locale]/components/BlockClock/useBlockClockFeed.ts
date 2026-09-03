'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useBlockSubscription, useTxPoolSubscription } from '@/services/thor/subscriptions'
import { useLatestBlocksLive } from '@/services/veworld-indexer/latest-blocks'
import { type ClockSnapshot, createBlockClockStore } from './feed-store'

export type BlockClockFeed = ClockSnapshot & {
  /** Whether the node socket is open; otherwise the head arrives on the indexer poll. */
  live: boolean
}

// Same first page the Blocks card polls, so both read one query.
const HOME_ROWS = 5

export const useBlockClockFeed = (): BlockClockFeed => {
  const [store] = useState(() => createBlockClockStore())

  const live = useBlockSubscription(store.onBlock)
  useTxPoolSubscription(store.onPendingTx)

  const { data } = useLatestBlocksLive({ size: HOME_ROWS })
  const indexed = data?.data[0]
  useEffect(() => store.onIndexed(indexed), [store, indexed])

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return { ...snapshot, live }
}
