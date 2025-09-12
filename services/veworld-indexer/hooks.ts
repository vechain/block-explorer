'use client'

import { useQuery } from '@tanstack/react-query'
import { useThorClient } from '@/services/thor/thor-client'
import { accountFungibleTokenContractsQueryOptions } from './fungible-token-contracts'
import { nftHoldersQueryOptions } from './nft-holders'
import type {
  IndexerGetContractTransactionsParams,
  IndexerGetFungibleTokenContractsParams,
  IndexerGetTransactionsParams,
  IndexerGetTransfersParams,
} from './schemas'
import { totalVetStakedQueryOptions } from './total-vet-staked'
import { totalVthoClaimedQueryOptions } from './total-vtho-claimed'
import { accountTransactionsQueryOptions } from './transactions'
import { contractTransactionsQueryOptions } from './transactions-contract'
import { accountTransfersQueryOptions } from './transfers'

export const useNftHolders = () => {
  const { activeNetwork } = useThorClient()
  return useQuery(nftHoldersQueryOptions(activeNetwork.name))
}

export const useTotalVetStaked = () => {
  const { activeNetwork } = useThorClient()
  return useQuery(totalVetStakedQueryOptions(activeNetwork.name))
}

export const useTotalVthoClaimed = () => {
  const { activeNetwork } = useThorClient()
  return useQuery(totalVthoClaimedQueryOptions(activeNetwork.name))
}

export const useAccountTransactions = ({ params }: { params: IndexerGetTransactionsParams }) => {
  const { activeNetwork } = useThorClient()
  return useQuery(accountTransactionsQueryOptions(activeNetwork.name, params))
}

export const useAccountTransfers = ({ params }: { params: IndexerGetTransfersParams }) => {
  const { activeNetwork } = useThorClient()
  return useQuery(accountTransfersQueryOptions(activeNetwork.name, params))
}

export const useAccountFungibleTokenContracts = ({ params }: { params: IndexerGetFungibleTokenContractsParams }) => {
  const { activeNetwork } = useThorClient()
  return useQuery(accountFungibleTokenContractsQueryOptions(activeNetwork.name, params))
}

export const useContractTransactions = ({ params }: { params: IndexerGetContractTransactionsParams }) => {
  const { activeNetwork } = useThorClient()
  return useQuery(contractTransactionsQueryOptions(activeNetwork.name, params))
}
