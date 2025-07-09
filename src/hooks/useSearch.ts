import { Address, Hex, Revision } from "@vechain/sdk-core"
import { getBlock } from "@/actions/getBlock"
import { getTransaction } from "@/actions/getTransaction"
import { getAccount } from "@/actions/getAccount"
import { getVnsAddress } from "@/actions/getVnsAddress"
import { useMutation } from "@tanstack/react-query"
import { useThorClient } from "@/hooks/thor/useThorClient"
import { ThorClient } from "@vechain/sdk-network"
import { Network } from "@/constants/network"

export function useSearch() {
  const { thorClient, activeNetwork } = useThorClient()

  return useMutation({
    mutationFn: (searchTerm: string) => search({ searchTerm, thorClient, activeNetwork }),
  })
}

async function search({
  searchTerm,
  thorClient,
  activeNetwork,
}: {
  searchTerm: string
  thorClient: ThorClient
  activeNetwork: Network
}): Promise<{ redirectTo: string }> {
  // Check if it's an address
  const account = await getAccount({ thorClient, address: Address.of(searchTerm) })
  if (account) {
    return {
      redirectTo: `/account/${account.address}`,
    }
  }

  // Check if it's a block
  const block = await getBlock({ thorClient, revision: Revision.of(searchTerm) })
  if (block) {
    return {
      redirectTo: `/block/${block.id}`,
    }
  }

  // Check if it's a transaction
  const transaction = await getTransaction({ thorClient, transactionId: Hex.of(searchTerm) })
  if (transaction) {
    return {
      redirectTo: `/transaction/${transaction.id}`,
    }
  }

  // Search by VNS domain
  const address = await getVnsAddress({ thorClient, networkName: activeNetwork.name, name: searchTerm })
  if (address) {
    return {
      redirectTo: `/account/${address.toString()}`,
    }
  }

  throw new Error("No results found")
}
