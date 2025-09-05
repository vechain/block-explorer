'use client'

import { useMutation } from '@tanstack/react-query'
import { Address, Hex, Revision } from '@vechain/sdk-core'
import type { ThorClient } from '@vechain/sdk-network'
import type { Network } from '@/lib/constants/network'
import { getAccount } from '@/services/thor/account'
import { getBlock } from '@/services/thor/block'
import { useThorClient } from '@/services/thor/thor-client'
import { getTransaction } from '@/services/thor/transaction'
import { getVnsAddress } from '@/services/thor/vns'

export const useSearch = () => {
  const { thorClient, activeNetwork } = useThorClient()

  return useMutation({
    mutationFn: (searchTerm: string) => search({ searchTerm, thorClient, activeNetwork }),
  })
}

const search = async ({
  searchTerm,
  thorClient,
  activeNetwork,
}: {
  searchTerm: string
  thorClient: ThorClient
  activeNetwork: Network
}): Promise<{ redirectTo: string }> => {
  const isAddress = Address.isValid(searchTerm)
  if (isAddress) {
    const account = await getAccount({ thorClient, address: Address.of(searchTerm) })
    if (account) {
      return {
        redirectTo: `/address/${account.address}`,
      }
    }
  }

  const isBlock = Revision.isValid(searchTerm)
  if (isBlock) {
    const block = await getBlock({ thorClient, revision: Revision.of(searchTerm) })
    if (block) {
      return {
        redirectTo: `/block/${block.id}`,
      }
    }
  }

  const isTransaction = searchTerm.startsWith('0x') && Hex.isValid(searchTerm)
  if (isTransaction) {
    const transaction = await getTransaction({ thorClient, transactionId: Hex.of(searchTerm) })
    if (transaction) {
      return {
        redirectTo: `/transaction/${transaction.id}`,
      }
    }
  }

  const isVnsDomain = searchTerm.endsWith('.vet')
  if (isVnsDomain) {
    const address = await getVnsAddress({ thorClient, networkName: activeNetwork.name, name: searchTerm })
    if (address) {
      return {
        redirectTo: `/address/${address.toString()}`,
      }
    }
  }

  throw new Error('No results found')
}
