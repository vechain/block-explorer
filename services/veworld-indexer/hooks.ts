'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { ABIEvent, ERC20_ABI } from '@vechain/sdk-core'
import type { AddressString, ExpandedBlock } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { blockExpandedQueryOptions, bestBlockCompressedQueryOptions } from '@/services/thor/block'
import { accountTotalsQueryOptions, AccountTimeFrame } from './account-totals'
import { accountOverviewQueryOptions } from './account-overview'
import { accountErc20ContractsQueryOptions } from './erc20-contracts'
import { contractQueryOptions } from './contracts'
import { deployedContractsQueryOptions } from './deployed-contracts'
import { accountErc721TokensQueryOptions } from './nfts'
import type {
  IndexerGetContractTransactionsParams,
  IndexerGetErc20ContractsParams,
  IndexerGetErc721Params,
  IndexerGetTransactionsParams,
} from './schemas'
import { totalVetStakedQueryOptions } from './total-vet-staked'
import { type TotalVetStakedRange, totalVetStakedHistoricQueryOptions } from './total-vet-staked-historic'
import { accountTransactionsQueryOptions } from './transactions'
import { contractTransactionsQueryOptions } from './transactions-contract'
import { ALL_VALIDATORS_COUNT_QUERY_KEY, getAllValidatorsCount, ValidatorStatus } from './validators'

export const useTotalVetStaked = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVetStakedQueryOptions(activeNetwork.name))
}

export const useTotalVetStakedHistoric = (range: TotalVetStakedRange) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVetStakedHistoricQueryOptions(activeNetwork.name, range))
}

export const useAccountTotals = (timeFrame: AccountTimeFrame) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTotalsQueryOptions(activeNetwork.name, timeFrame))
}

export const useAccountOverview = (address: string) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountOverviewQueryOptions(activeNetwork.name, address))
}

export { AccountTimeFrame }

const useAccountTransactions = ({
  params,
  enabled = true,
}: {
  params: IndexerGetTransactionsParams
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTransactionsQueryOptions(activeNetwork.name, params, { enabled }))
}

const useContractTransactions = ({
  params,
  enabled = true,
}: {
  params: IndexerGetContractTransactionsParams
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(contractTransactionsQueryOptions(activeNetwork.name, params, { enabled }))
}

export const useAddressTransactions = ({
  address,
  hasCode,
  page = 0,
  size = 10,
}: {
  address: AddressString
  hasCode: boolean | undefined
  page?: number
  size?: number
}) => {
  const contractTxs = useContractTransactions({
    params: { contractAddress: address, page, size },
    enabled: hasCode === true,
  })

  const accountTxs = useAccountTransactions({
    params: { origin: address, page, size },
    enabled: hasCode === false,
  })

  return hasCode ? contractTxs : accountTxs
}

export const useAccountErc20Contracts = ({ params }: { params: IndexerGetErc20ContractsParams }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountErc20ContractsQueryOptions(activeNetwork.name, params))
}

export const useAccountErc721 = ({ params }: { params: IndexerGetErc721Params }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountErc721TokensQueryOptions(activeNetwork.name, params))
}

export const useContract = ({ address }: { address: AddressString }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(contractQueryOptions(activeNetwork.name, address))
}

export const useDeployedContracts = ({ address }: { address: AddressString }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(deployedContractsQueryOptions(activeNetwork.name, address))
}

export const useValidatorsCount = (status?: ValidatorStatus) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, activeNetwork.name, status],
    queryFn: () => getAllValidatorsCount(activeNetwork.name, status),
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
  })
}

export { ValidatorStatus }

const isExpandedBlock = (block: unknown): block is ExpandedBlock => {
  return block !== null && block !== undefined && typeof block === 'object' && 'transactions' in block
}

// Get Transfer event signature hash from ERC20 ABI (same for ERC721)
const getTransferEventSignature = (): `0x${string}` => {
  const transferEvent = ERC20_ABI.find(item => item.type === 'event' && item.name === 'Transfer')
  if (!transferEvent) {
    // Fallback to well-known hash if ABI lookup fails
    return '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as `0x${string}`
  }
  const eventAbi = new ABIEvent(transferEvent)
  return eventAbi.signatureHash as `0x${string}`
}

const TRANSFER_EVENT_SIGNATURE = getTransferEventSignature()

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

const extractTransfersFromBlocks = (
  blocks: ExpandedBlock[],
  eventTypeFilter: (eventType: string) => boolean,
): TransferFromBlock[] => {
  const transfers: TransferFromBlock[] = []

  for (const block of blocks) {
    for (const tx of block.transactions) {
      if (!tx.outputs || tx.reverted) continue

      for (const output of tx.outputs) {
        // Extract VET transfers from outputs.transfers
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

        // Extract token transfers from events
        if (output.events) {
          for (const event of output.events) {
            if (event.topics.length === 0) continue
            const [signature] = event.topics

            // Check if it's a Transfer event
            if (signature === TRANSFER_EVENT_SIGNATURE && event.topics.length >= 3) {
              // Extract from and to from topics (they're indexed)
              const fromTopic = event.topics[1]
              const toTopic = event.topics[2]

              // Topics are 32 bytes, addresses are 20 bytes (last 20 bytes)
              const from = `0x${fromTopic.slice(-40)}` as AddressString
              const to = `0x${toTopic.slice(-40)}` as AddressString
              const tokenAddress = event.address

              // ERC721 has 4 topics: signature, from, to, tokenId (tokenId is indexed)
              // ERC20 has 3 topics: signature, from, to (value is in data)
              if (event.topics.length === 4) {
                // ERC721 Transfer
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
                // ERC20 Transfer - value is in data field
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

/**
 * Shared hook to fetch recent expanded blocks
 * Used by Activity, Token Transfers, and NFT Transfers sections
 */
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

  // Auto-expand if we don't have enough blocks yet
  useEffect(() => {
    if (!blocksPending && latestBlocks.length < count && blocksToFetch < 100 && bestBlockNumber > blocksToFetch) {
      setBlocksToFetch(prev => Math.min(prev + 10, 100))
    }
  }, [blocksPending, latestBlocks.length, count, blocksToFetch, bestBlockNumber])

  return {
    data: latestBlocks,
    isPending: blocksPending && latestBlocks.length === 0,
  }
}

/**
 * Extract token transfers (VET + ERC20) from expanded blocks
 */
export const useRecentTokenTransfers = ({ count }: { count: number }) => {
  const { data: blocks, isPending } = useRecentBlocksExpanded({ count: Math.max(count * 2, 20) })

  const transfers = useMemo(() => {
    if (!blocks || blocks.length === 0) return []

    const allTransfers = extractTransfersFromBlocks(
      blocks,
      eventType => eventType === 'VET' || eventType === 'FUNGIBLE_TOKEN',
    )

    // Remove duplicates and sort
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

/**
 * Extract NFT transfers from expanded blocks
 */
export const useRecentNFTTransfers = ({ count }: { count: number }) => {
  const { data: blocks, isPending } = useRecentBlocksExpanded({ count: Math.max(count * 10, 50) })

  const transfers = useMemo(() => {
    if (!blocks || blocks.length === 0) return []

    const allTransfers = extractTransfersFromBlocks(blocks, eventType => eventType === 'NFT')

    // Remove duplicates and sort
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
