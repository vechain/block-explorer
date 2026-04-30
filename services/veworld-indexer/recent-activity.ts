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

export const useRecentBlocksCompressed = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  const { data: bestBlock } = useQuery(bestBlockCompressedQueryOptions(activeNetwork.name))
  const bestBlockNumber = bestBlock?.number ?? count

  const blockQueries = useMemo(() => {
    const queries = []
    for (let i = 0; i < count; i++) {
      const revision = bestBlockNumber - i
      if (revision > 0) {
        queries.push(blockCompressedQueryOptions(activeNetwork.name, revision))
      }
    }
    return queries
  }, [activeNetwork.name, bestBlockNumber, count])

  const blocksResult = useQueries({
    queries: blockQueries,
    combine: queries => ({
      data: queries.map(query => query.data).filter(isCompressedBlock),
      isPending: queries.some(query => query.isPending),
    }),
  })

  return {
    data: blocksResult.data,
    isPending: blocksResult.isPending && blocksResult.data.length === 0,
  }
}

export const useRecentBlocksExpanded = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  const [blocksToFetch, setBlocksToFetch] = useState(count)
  const { data: bestBlock } = useQuery(bestBlockCompressedQueryOptions(activeNetwork.name))
  const bestBlockNumber = bestBlock?.number ?? blocksToFetch

  const blockQueries = useMemo(() => {
    const queries = []
    for (let i = 0; i < blocksToFetch; i++) {
      const revision = bestBlockNumber - i
      if (revision > 0) {
        queries.push(blockExpandedQueryOptions(activeNetwork.name, revision))
      }
    }
    return queries
  }, [activeNetwork.name, bestBlockNumber, blocksToFetch])

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
    if (!blocksPending && latestBlocks.length < count && bestBlockNumber > blocksToFetch) {
      setBlocksToFetch(prev => prev + 10)
    }
  }, [blocksPending, latestBlocks.length, count, blocksToFetch, bestBlockNumber])

  return {
    data: latestBlocks,
    isPending: blocksPending && latestBlocks.length === 0,
    bestBlockNumber,
  }
}
