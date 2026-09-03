'use client'

import { type ReactNode, createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useSettingsStore } from '@/lib/stores/settings'
import { useBlockExpanded } from '@/services/thor/block'
import { useBlockSubscription, useTxPoolSubscription } from '@/services/thor/subscriptions'
import { useLatestBlocksLive } from '@/services/veworld-indexer/latest-blocks'
import { type LiveHeadSnapshot, createLiveHeadStore, totalsOf } from './store'

export type LiveHead = LiveHeadSnapshot & {
  /** Whether the node socket is open; otherwise the head arrives on the indexer poll. */
  live: boolean
}

const LiveHeadContext = createContext<LiveHead | undefined>(undefined)

// Same first page the Blocks card renders, so both read one query.
const HOME_ROWS = 5

const LiveHeadFeed = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createLiveHeadStore())

  const live = useBlockSubscription(store.onBlock)
  useTxPoolSubscription(store.onPendingTx)

  const { data } = useLatestBlocksLive({ size: HOME_ROWS })
  const indexed = data?.data
  useEffect(() => store.onIndexed(indexed), [store, indexed])

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const { head } = snapshot

  // One expanded fetch per announced block puts the totals up seconds before the index has them.
  const { data: expanded } = useBlockExpanded(head && head.clauseCount === undefined ? head.id : undefined)
  useEffect(() => {
    if (expanded) store.onTotals(expanded.number, totalsOf(expanded))
  }, [store, expanded])

  const value = useMemo(() => ({ ...snapshot, live }), [snapshot, live])
  return <LiveHeadContext.Provider value={value}>{children}</LiveHeadContext.Provider>
}

export const LiveHeadProvider = ({ children }: { children: ReactNode }) => {
  const networkName = useSettingsStore(state => state.activeNetwork.name)
  // Remount on a network switch so the head, pending count and sockets start clean.
  return <LiveHeadFeed key={networkName}>{children}</LiveHeadFeed>
}

export const useLiveHead = () => {
  const value = useContext(LiveHeadContext)
  if (!value) throw new Error('useLiveHead needs a LiveHeadProvider above it')
  return value
}
