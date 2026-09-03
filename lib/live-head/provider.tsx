'use client'

import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { useBlockSubscription, useTxPoolSubscription } from '@/services/thor/subscriptions'
import { liveBlocksQueryKey, useLatestBlocks, useLatestBlocksLive } from '@/services/veworld-indexer/latest-blocks'
import { liveTransactionsQueryKey } from '@/services/veworld-indexer/latest-transactions'
import { liveTransfersQueryKey } from '@/services/veworld-indexer/latest-transfers'
import { HISTORY_BLOCKS, type LiveHeadSnapshot, createLiveHeadStore } from './store'

export type LiveHead = LiveHeadSnapshot & {
  /** Whether the node socket is open; without it the beat still lands on the slot-aware poll. */
  live: boolean
}

const LiveHeadContext = createContext<LiveHead | undefined>(undefined)

// Same first page the Blocks card renders, so both read one query.
const HOME_ROWS = 5
const CATCH_UP_STEP_MS = 500
const CATCH_UP_WINDOW_MS = 8_000

const LiveHeadFeed = ({ networkName, children }: { networkName: NetworkName; children: ReactNode }) => {
  const [store] = useState(() => createLiveHeadStore())
  const queryClient = useQueryClient()

  const live = useBlockSubscription(store.onBlock)
  useTxPoolSubscription(store.onPendingTx)

  const { data } = useLatestBlocksLive({ size: HOME_ROWS })
  const indexed = data?.data
  useEffect(() => store.onIndexed(indexed), [store, indexed])

  // One deeper page seeds the usage history; every beat after that extends it.
  const { data: seed } = useLatestBlocks({ size: HISTORY_BLOCKS })
  const seeded = seed?.pages[0]?.data
  useEffect(() => store.onIndexed(seeded), [store, seeded])

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const { announced } = snapshot

  // The node announces a block ~3 s before its slot timestamp and the index serves it a few hundred
  // ms after, so start refreshing every home feed at the timestamp and stop once blocks has it.
  useEffect(() => {
    if (!announced) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const deadline = Date.now() + CATCH_UP_WINDOW_MS
    const feeds = [liveBlocksQueryKey, liveTransactionsQueryKey, liveTransfersQueryKey].map(key => key(networkName))

    const servedHead = () =>
      queryClient
        .getQueriesData<{ data: { number: number }[] }>({ queryKey: liveBlocksQueryKey(networkName) })
        .reduce((best, [, page]) => Math.max(best, page?.data[0]?.number ?? -1), -1)

    const poke = () => {
      void Promise.all(feeds.map(queryKey => queryClient.refetchQueries({ queryKey }))).then(() => {
        if (cancelled || servedHead() >= announced.number || Date.now() > deadline) return
        timer = setTimeout(poke, CATCH_UP_STEP_MS)
      })
    }
    timer = setTimeout(poke, Math.max(0, announced.timestamp - Date.now()))

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [announced, networkName, queryClient])

  const value = useMemo(() => ({ ...snapshot, live }), [snapshot, live])
  return <LiveHeadContext.Provider value={value}>{children}</LiveHeadContext.Provider>
}

export const LiveHeadProvider = ({ children }: { children: ReactNode }) => {
  const networkName = useSettingsStore(state => state.activeNetwork.name)
  // Remount on a network switch so the head, pending count and sockets start clean.
  return (
    <LiveHeadFeed key={networkName} networkName={networkName}>
      {children}
    </LiveHeadFeed>
  )
}

export const useLiveHead = () => {
  const value = useContext(LiveHeadContext)
  if (!value) throw new Error('useLiveHead needs a LiveHeadProvider above it')
  return value
}
