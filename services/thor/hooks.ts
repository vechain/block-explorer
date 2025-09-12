'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import type { Revision } from '@vechain/sdk-core'
import type { AddressString, ExpandedBlockDetail, HexString } from '@/lib/schemas'
import { accountQueryOptions } from './account'
import { bestBlockQueryOptions, blockQueryOptions, latestBlocksQueryOptions } from './block'
import { type Vip180List, vip180QueryOptions } from './contract'
import { useThorClient } from './thor-client'
import { transactionQueryOptions, transactionReceiptQueryOptions } from './transaction'
import { vnsNameQueryOptions } from './vns'

export const useAccount = (address: AddressString) => {
  const { thorClient, activeNetwork } = useThorClient()
  return useQuery(accountQueryOptions(thorClient, activeNetwork.name, address))
}

export const useBlock = (revision: Revision) => {
  const { thorClient, activeNetwork } = useThorClient()
  return useQuery(blockQueryOptions(thorClient, activeNetwork.name, revision))
}

export const useBestBlock = () => {
  const { thorClient, activeNetwork } = useThorClient()
  return useQuery(bestBlockQueryOptions(thorClient, activeNetwork.name))
}

export const useLatestBlocks = ({ count }: { count: number }) => {
  const { thorClient, activeNetwork } = useThorClient()
  const { data: bestBlock } = useBestBlock()

  const bestBlockNumber = bestBlock?.number ?? count
  const blockIds = []

  for (let i = 0; i < count; i++) {
    const currentBlockId = bestBlockNumber - i
    if (currentBlockId > 0) {
      blockIds.push(currentBlockId)
    }
  }

  return useQueries({
    queries: blockIds.map(blockId => latestBlocksQueryOptions(thorClient, activeNetwork.name, blockId)),
    combine: queries => ({
      data: queries.map(query => query.data).filter(isExpandedBlockDetail),
      isPending: queries.some(query => query.isPending),
    }),
  })
}

const isExpandedBlockDetail = (block: unknown): block is ExpandedBlockDetail => {
  return Boolean(block)
}

export const useVip180List = ({
  addresses,
  accountAddress,
}: {
  addresses: AddressString[]
  accountAddress: AddressString
}) => {
  const { activeNetwork, thorClient } = useThorClient()

  return useQueries({
    queries: addresses.map(address => vip180QueryOptions(thorClient, activeNetwork.name, address, accountAddress)),
    combine: queries => ({
      data: queries.reduce((acc, query) => {
        if (query.data) {
          const { address, vip180 } = query.data
          acc[address] = vip180
        }
        return acc
      }, {} as Vip180List),
      isPending: queries.some(query => query.isPending),
    }),
  })
}

export const useTransaction = (transactionId: HexString) => {
  const { thorClient, activeNetwork } = useThorClient()
  return useQuery(transactionQueryOptions(thorClient, activeNetwork.name, transactionId))
}

export const useTransactionReceipt = (transactionId: HexString) => {
  const { thorClient, activeNetwork } = useThorClient()
  return useQuery({
    ...transactionReceiptQueryOptions(thorClient, activeNetwork.name, transactionId),
    refetchInterval: query => (query.state.data ? false : 3000),
  })
}

export const useVnsName = (address: AddressString) => {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery(vnsNameQueryOptions(thorClient, activeNetwork.name, address))
}
