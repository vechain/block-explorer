import { useQueries, useQuery } from '@tanstack/react-query'
import { ERC20_ABI, ZERO_ADDRESS } from '@vechain/sdk-core'
import type { Contract } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

export const useErc20Contracts = ({ contractAddressList }: { contractAddressList: Set<AddressString> }) => {
  const { activeNetwork } = useSettingsStore()

  const queries = []

  for (const contractAddress of contractAddressList.values()) {
    queries.push({
      ...erc20ContractQueryOptions(activeNetwork.name, contractAddress),
      enabled: contractAddressList.size > 0,
    })
  }

  return useQueries({
    queries,
    combine: queries => ({
      data: queries.reduce((acc, query) => {
        if (query.data?.erc20) {
          const { address, erc20 } = query.data
          acc.set(address, erc20)
        }
        return acc
      }, new Map<AddressString, Erc20>()),
      isPending: queries.some(query => query.isPending),
    }),
  })
}

export const useErc20BalanceOf = ({
  contract,
  accountAddress,
}: {
  contract: Erc20['contract']
  accountAddress: AddressString
}) => {
  return useQuery(erc20BalanceOfQueryOptions(contract, accountAddress))
}

const erc20ContractQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [getErc20Contract.name, networkName, address],
  queryFn: () => getErc20Contract(networkName, address),
  select: (data: Erc20 | null) => ({ address, erc20: data }),
})

const erc20BalanceOfQueryOptions = (contract: Erc20['contract'], accountAddress: AddressString) => ({
  queryKey: [getErc20BalanceOf.name, contract.address, accountAddress],
  queryFn: () => getErc20BalanceOf(contract, accountAddress),
})

const getErc20Contract = async (networkName: NetworkName, contractAddress: AddressString): Promise<Erc20 | null> => {
  if (contractAddress === ZERO_ADDRESS) return null

  const thorClient = getThorClient(networkName)
  const erc20 = thorClient.contracts.load(contractAddress, ERC20_ABI)

  const [name] = await erc20.read.name()
  const [symbol] = await erc20.read.symbol()
  const [decimals] = await erc20.read.decimals()

  return { address: contractAddress, symbol, decimals, name, contract: erc20 }
}

const getErc20BalanceOf = async (
  contract: Contract<typeof ERC20_ABI>,
  accountAddress: AddressString,
): Promise<bigint | null> => {
  if (accountAddress === ZERO_ADDRESS) return null

  const [balance] = await contract.read.balanceOf(accountAddress)

  return balance
}

export type Erc20 = {
  address: AddressString
  symbol: string
  decimals: number
  name: string
  contract: Contract<typeof ERC20_ABI>
}
