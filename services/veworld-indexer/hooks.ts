'use client'

import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/lib/stores/settings'
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
