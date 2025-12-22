'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import type { AddressString, ExpandedBlock } from '@/lib/schemas'
import { isNotNullish } from '@/lib/type-predicates'
import { useSettingsStore } from '@/lib/stores/settings'
import { type Erc20, useErc20Contracts } from '@/services/thor/tokens/erc20'
import { blockExpandedQueryOptions, bestBlockCompressedQueryOptions } from '@/services/thor/block'
import { accountTotalsQueryOptions, AccountTimeFrame } from './account-totals'
import { accountErc20ContractsQueryOptions } from './erc20-contracts'
import { nftHoldersQueryOptions } from './nft-holders'
import { accountErc721TokensQueryOptions } from './nfts'
import type {
  IndexerGetContractTransactionsParams,
  IndexerGetErc20ContractsParams,
  IndexerGetErc721Params,
  IndexerGetTransactionsParams,
  IndexerGetTransfersParams,
} from './schemas'
import { totalVetStakedQueryOptions } from './total-vet-staked'
import { type TotalVetStakedRange, totalVetStakedHistoricQueryOptions } from './total-vet-staked-historic'
import { totalVthoClaimedQueryOptions } from './total-vtho-claimed'
import { accountTransactionsQueryOptions } from './transactions'
import { contractTransactionsQueryOptions } from './transactions-contract'
import { accountTransfersQueryOptions } from './transfers'
import { getAllValidatorsCount, ValidatorStatus } from './validators'

export const useNftHolders = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(nftHoldersQueryOptions(activeNetwork.name))
}

export const useTotalVetStaked = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVetStakedQueryOptions(activeNetwork.name))
}

export const useTotalVetStakedHistoric = (range: TotalVetStakedRange) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVetStakedHistoricQueryOptions(activeNetwork.name, range))
}

export const useTotalVthoClaimed = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVthoClaimedQueryOptions(activeNetwork.name))
}

export const useAccountTotals = (timeFrame: AccountTimeFrame) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTotalsQueryOptions(activeNetwork.name, timeFrame))
}

export { AccountTimeFrame }

export const useAccountTransactions = ({ params }: { params: IndexerGetTransactionsParams }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTransactionsQueryOptions(activeNetwork.name, params))
}

export const useAccountTransfers = ({ params }: { params: IndexerGetTransfersParams }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTransfersQueryOptions(activeNetwork.name, params))
}

export const useAccountTransfersWithTokens = ({ params }: { params: IndexerGetTransfersParams }) => {
  const { data: transfers, isLoading, isError, error } = useAccountTransfers({ params })

  const allTokenAddresses: AddressString[] = useMemo(
    () => transfers?.data.map(transfer => transfer.tokenAddress).filter(isNotNullish) ?? [],
    [transfers?.data],
  )

  const { data: erc20Map, isPending: isPendingErc20List } = useErc20Contracts({
    contractAddressList: new Set<AddressString>(allTokenAddresses),
  })

  return {
    transfers,
    erc20Map: erc20Map ?? new Map<AddressString, Erc20>(),
    isLoading: isLoading || isPendingErc20List,
    isError,
    error,
  }
}

export const useContractTransactions = ({ params }: { params: IndexerGetContractTransactionsParams }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(contractTransactionsQueryOptions(activeNetwork.name, params))
}

export const useAccountErc20Contracts = ({ params }: { params: IndexerGetErc20ContractsParams }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountErc20ContractsQueryOptions(activeNetwork.name, params))
}

export const useAccountErc721 = ({ params }: { params: IndexerGetErc721Params }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountErc721TokensQueryOptions(activeNetwork.name, params))
}

export const useValidatorsCount = (status?: ValidatorStatus) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    queryKey: [getAllValidatorsCount.name, activeNetwork.name, status],
    queryFn: () => getAllValidatorsCount(activeNetwork.name, status),
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    retry: (failureCount: number, error: Error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error?.message?.includes('fetch')) {
        return true
      }
      return false
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with 30s max
  })
}

export { ValidatorStatus }

const isExpandedBlock = (block: unknown): block is ExpandedBlock => {
  return block !== null && block !== undefined && typeof block === 'object' && 'transactions' in block
}

export const useRecentTokenTransfers = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  const [blocksToFetch, setBlocksToFetch] = useState(5)
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

  const latestBlocks = blocksResult.data
  const blocksPending = blocksResult.isPending

  const { addressArray, recentBlockNumbersArray } = useMemo(() => {
    const addresses = new Set<AddressString>()
    const blockNumbers = new Set<number>()

    if (latestBlocks?.length > 0) {
      for (const block of latestBlocks) {
        blockNumbers.add(Number(block.number))
        for (const tx of block.transactions) {
          addresses.add(tx.origin)
          for (const clause of tx.clauses) {
            if (clause.to) addresses.add(clause.to)
          }
        }
      }
    }

    return {
      addressArray: Array.from(addresses).slice(0, 30),
      recentBlockNumbersArray: Array.from(blockNumbers).sort((a, b) => a - b),
    }
  }, [latestBlocks])

  const recentBlockNumbers = useMemo(() => new Set(recentBlockNumbersArray), [recentBlockNumbersArray])

  const transferQueries = useMemo(
    () =>
      addressArray.map(address =>
        accountTransfersQueryOptions(activeNetwork.name, {
          address,
          page: 0,
          size: 50,
          direction: 'DESC',
        }),
      ),
    [activeNetwork.name, addressArray],
  )

  const transferResults = useQueries({
    queries: transferQueries,
    combine: queries => ({
      data: queries.flatMap(query => query.data?.data ?? []),
      isPending: queries.some(query => query.isPending),
    }),
  })

  const allTransfersRef = useRef<Map<string, (typeof transferResults.data)[0]>>(new Map())

  const filteredTransfers = useMemo(() => {
    if (recentBlockNumbersArray.length > 0) {
      const minBlock = Math.min(...recentBlockNumbersArray)
      for (const [id, transfer] of allTransfersRef.current.entries()) {
        if (transfer.blockNumber < minBlock - 10) {
          allTransfersRef.current.delete(id)
        }
      }
    }

    const transfersData = transferResults.data

    if (transfersData?.length > 0) {
      for (const transfer of transfersData) {
        if (recentBlockNumbers.has(transfer.blockNumber) && !allTransfersRef.current.has(transfer.id)) {
          allTransfersRef.current.set(transfer.id, transfer)
        }
      }
    }

    return Array.from(allTransfersRef.current.values())
      .filter(
        transfer =>
          recentBlockNumbers.has(transfer.blockNumber) &&
          (transfer.eventType === 'VET' || transfer.eventType === 'FUNGIBLE_TOKEN'),
      )
      .sort((a, b) => {
        if (b.blockTimestamp !== a.blockTimestamp) return b.blockTimestamp - a.blockTimestamp
        return b.blockNumber - a.blockNumber
      })
      .slice(0, count)
  }, [transferResults.data, recentBlockNumbers, recentBlockNumbersArray, count])

  useEffect(() => {
    if (
      !blocksPending &&
      !transferResults.isPending &&
      filteredTransfers.length < count &&
      blocksToFetch < 30 &&
      bestBlockNumber > blocksToFetch
    ) {
      setBlocksToFetch(prev => Math.min(prev + 5, 30))
    }
  }, [blocksPending, transferResults.isPending, filteredTransfers.length, count, blocksToFetch, bestBlockNumber])

  const hasData = filteredTransfers.length > 0
  const isInitialLoad = blocksPending && transferResults.isPending && !hasData

  return {
    data: isInitialLoad ? undefined : filteredTransfers,
    isPending: isInitialLoad,
  }
}
