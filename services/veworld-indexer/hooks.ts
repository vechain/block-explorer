'use client'

import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/lib/stores/settings'
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
import { totalVthoClaimedQueryOptions } from './total-vtho-claimed'
import { accountTransactionsQueryOptions } from './transactions'
import { contractTransactionsQueryOptions } from './transactions-contract'
import { accountTransfersQueryOptions } from './transfers'

export const useNftHolders = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(nftHoldersQueryOptions(activeNetwork.name))
}

export const useTotalVetStaked = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVetStakedQueryOptions(activeNetwork.name))
}

export const useTotalVthoClaimed = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalVthoClaimedQueryOptions(activeNetwork.name))
}

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
