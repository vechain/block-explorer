'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import type { CompressedBlock, ExpandedBlock } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import {
  blockCompressedQueryOptions,
  blockExpandedQueryOptions,
  bestBlockCompressedQueryOptions,
} from '@/services/thor/block'

const isExpandedBlock = (block: unknown): block is ExpandedBlock => {
  return block !== null && block !== undefined && typeof block === 'object' && 'transactions' in block
}

const isCompressedBlock = (block: unknown): block is CompressedBlock => {
  return block !== null && block !== undefined && typeof block === 'object' && 'transactions' in block
}

// The window is anchored to the head, so there is nothing to fetch until it is known.
// Defaulting to the block count instead would fetch that many blocks up from genesis.
const windowRevisions = (bestBlockNumber: number | undefined, count: number) => {
  if (bestBlockNumber === undefined) return []

  const revisions = []
  for (let i = 0; i < count; i++) {
    const revision = bestBlockNumber - i
    if (revision > 0) revisions.push(revision)
  }
  return revisions
}

export const useRecentBlocksCompressed = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  const { data: bestBlock, isPending: bestBlockPending } = useQuery(bestBlockCompressedQueryOptions(activeNetwork.name))

  const blockQueries = useMemo(
    () =>
      windowRevisions(bestBlock?.number, count).map(revision =>
        blockCompressedQueryOptions(activeNetwork.name, revision),
      ),
    [activeNetwork.name, bestBlock?.number, count],
  )

  const blocksResult = useQueries({
    queries: blockQueries,
    combine: queries => ({
      data: queries.map(query => query.data).filter(isCompressedBlock),
      isPending: queries.some(query => query.isPending),
    }),
  })

  return {
    data: blocksResult.data,
    isPending: (bestBlockPending || blocksResult.isPending) && blocksResult.data.length === 0,
  }
}

export const useRecentBlocksExpanded = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  // Widens the window when blocks in it fail to load; tracks `count` so a larger page
  // size takes effect at once rather than ten blocks per render.
  const [extraBlocks, setExtraBlocks] = useState(0)
  // Clamped on read, so shrinking the page size cannot leave an earlier widening mounted.
  const extra = Math.min(extraBlocks, count)
  const blocksToFetch = count + extra
  const { data: bestBlock, isPending: bestBlockPending } = useQuery(bestBlockCompressedQueryOptions(activeNetwork.name))
  const bestBlockNumber = bestBlock?.number

  const blockQueries = useMemo(
    () =>
      windowRevisions(bestBlockNumber, blocksToFetch).map(revision =>
        blockExpandedQueryOptions(activeNetwork.name, revision),
      ),
    [activeNetwork.name, bestBlockNumber, blocksToFetch],
  )

  const blocksResult = useQueries({
    queries: blockQueries,
    combine: queries => ({
      data: queries.map(query => query.data).filter(isExpandedBlock),
      isPending: queries.some(query => query.isPending),
    }),
  })

  const latestBlocks = blocksResult.data ?? []
  const blocksPending = blocksResult.isPending

  useEffect(() => {
    if (bestBlockNumber === undefined || blocksPending) return
    if (latestBlocks.length < count && bestBlockNumber > blocksToFetch && extra < count) {
      setExtraBlocks(extra + 10)
    }
  }, [blocksPending, latestBlocks.length, count, blocksToFetch, bestBlockNumber, extra])

  return {
    data: latestBlocks,
    isPending: (bestBlockPending || blocksPending) && latestBlocks.length === 0,
    bestBlockNumber,
  }
}
