'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { ABIEvent, ERC20_ABI } from '@vechain/sdk-core'
import type { AddressString, ExpandedBlock } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { blockExpandedQueryOptions, bestBlockCompressedQueryOptions } from '@/services/thor/block'

export type TransferFromBlock = {
  id: string
  txId: `0x${string}`
  from: AddressString
  to: AddressString
  value: bigint
  tokenAddress: AddressString | null
  tokenId: string | null
  eventType: 'VET' | 'FUNGIBLE_TOKEN' | 'NFT'
  blockNumber: number
  blockTimestamp: number
  blockId: `0x${string}`
  topics: `0x${string}`[]
}

const isExpandedBlock = (block: unknown): block is ExpandedBlock => {
  return block !== null && block !== undefined && typeof block === 'object' && 'transactions' in block
}

const getTransferEventSignature = (): `0x${string}` => {
  const transferEvent = ERC20_ABI.find(item => item.type === 'event' && item.name === 'Transfer')
  if (!transferEvent) {
    return '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as `0x${string}`
  }
  const eventAbi = new ABIEvent(transferEvent)
  return eventAbi.signatureHash as `0x${string}`
}

const TRANSFER_EVENT_SIGNATURE = getTransferEventSignature()

const extractTransfersFromBlocks = (
  blocks: ExpandedBlock[],
  eventTypeFilter: (eventType: string) => boolean,
): TransferFromBlock[] => {
  const transfers: TransferFromBlock[] = []

  for (const block of blocks) {
    for (const tx of block.transactions) {
      if (!tx.outputs || tx.reverted) continue

      for (const output of tx.outputs) {
        if (output.transfers && eventTypeFilter('VET')) {
          for (const transfer of output.transfers) {
            transfers.push({
              id: `${tx.id}-vet-${transfer.sender}-${transfer.recipient}-${transfer.amount}`,
              txId: tx.id as `0x${string}`,
              from: transfer.sender,
              to: transfer.recipient,
              value: transfer.amount,
              tokenAddress: null,
              tokenId: null,
              eventType: 'VET',
              blockNumber: Number(block.number),
              blockTimestamp: block.timestamp,
              blockId: block.id as `0x${string}`,
              topics: [] as `0x${string}`[],
            })
          }
        }

        if (output.events) {
          for (const event of output.events) {
            if (event.topics.length === 0) continue
            const [signature] = event.topics

            if (signature === TRANSFER_EVENT_SIGNATURE && event.topics.length >= 3) {
              const fromTopic = event.topics[1]
              const toTopic = event.topics[2]

              const from = `0x${fromTopic.slice(-40)}` as AddressString
              const to = `0x${toTopic.slice(-40)}` as AddressString
              const tokenAddress = event.address

              if (event.topics.length === 4) {
                const tokenId = BigInt(event.topics[3]).toString()
                if (eventTypeFilter('NFT')) {
                  transfers.push({
                    id: `${tx.id}-nft-${tokenAddress}-${tokenId}`,
                    txId: tx.id as `0x${string}`,
                    from,
                    to,
                    value: 0n,
                    tokenAddress,
                    tokenId,
                    eventType: 'NFT',
                    blockNumber: Number(block.number),
                    blockTimestamp: block.timestamp,
                    blockId: block.id as `0x${string}`,
                    topics: event.topics as `0x${string}`[],
                  })
                }
              } else {
                const value = event.data && event.data !== '0x' ? BigInt(event.data) : 0n
                if (eventTypeFilter('FUNGIBLE_TOKEN')) {
                  transfers.push({
                    id: `${tx.id}-erc20-${tokenAddress}-${from}-${to}-${value}`,
                    txId: tx.id as `0x${string}`,
                    from,
                    to,
                    value,
                    tokenAddress,
                    tokenId: null,
                    eventType: 'FUNGIBLE_TOKEN',
                    blockNumber: Number(block.number),
                    blockTimestamp: block.timestamp,
                    blockId: block.id as `0x${string}`,
                    topics: event.topics as `0x${string}`[],
                  })
                }
              }
            }
          }
        }
      }
    }
  }

  return transfers
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

export const useRecentTokenTransfers = ({ count }: { count: number }) => {
  const { data: blocks, isPending } = useRecentBlocksExpanded({ count: Math.max(count * 2, 20) })

  const transfers = useMemo(() => {
    if (!blocks || blocks.length === 0) return []

    const allTransfers = extractTransfersFromBlocks(
      blocks,
      eventType => eventType === 'VET' || eventType === 'FUNGIBLE_TOKEN',
    )

    const uniqueTransfers = new Map<string, TransferFromBlock>()
    for (const transfer of allTransfers) {
      if (!uniqueTransfers.has(transfer.id)) {
        uniqueTransfers.set(transfer.id, transfer)
      }
    }

    return Array.from(uniqueTransfers.values())
      .sort((a, b) => {
        if (b.blockTimestamp !== a.blockTimestamp) return b.blockTimestamp - a.blockTimestamp
        return b.blockNumber - a.blockNumber
      })
      .slice(0, count)
  }, [blocks, count])

  return {
    data: transfers,
    isPending,
  }
}

export const useRecentNFTTransfers = ({ count }: { count: number }) => {
  const minBlocks = Math.max(count * 10, 50)
  const [blocksToFetch, setBlocksToFetch] = useState(minBlocks)

  useEffect(() => {
    setBlocksToFetch(prev => Math.max(prev, minBlocks))
  }, [minBlocks])

  const { data: blocks, isPending, bestBlockNumber } = useRecentBlocksExpanded({ count: blocksToFetch })

  const transfers = useMemo(() => {
    if (!blocks || blocks.length === 0) return []

    const allTransfers = extractTransfersFromBlocks(blocks, eventType => eventType === 'NFT')

    const uniqueTransfers = new Map<string, TransferFromBlock>()
    for (const transfer of allTransfers) {
      if (!uniqueTransfers.has(transfer.id)) {
        uniqueTransfers.set(transfer.id, transfer)
      }
    }

    return Array.from(uniqueTransfers.values())
      .sort((a, b) => {
        if (b.blockTimestamp !== a.blockTimestamp) return b.blockTimestamp - a.blockTimestamp
        return b.blockNumber - a.blockNumber
      })
      .slice(0, count)
  }, [blocks, count])

  const reachedChainStart = blocksToFetch >= bestBlockNumber

  useEffect(() => {
    if (!isPending && transfers.length < count && blocksToFetch < bestBlockNumber) {
      const increment = Math.max(count * 5, 100)
      setBlocksToFetch(prev => prev + increment)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, transfers.length, count])

  const hasMore = !reachedChainStart || transfers.length >= count

  return {
    data: transfers,
    isPending: isPending && transfers.length === 0,
    hasMore,
  }
}
