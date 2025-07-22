import { Address, Hex, Revision } from "@vechain/sdk-core"
import { getBlock } from "@/services/thor/block/actions"
import { getTransaction } from "@/services/thor/transaction/actions"
import { getAccount } from "@/services/thor/account/account"
import { getVnsAddress } from "@/services/thor/vns/actions"
import { useMutation } from "@tanstack/react-query"
import { useThorClient } from "@/services/thor/thor-client"
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

  const isTransaction = Hex.isValid(searchTerm)
  if (isTransaction) {
    const transaction = await getTransaction({ thorClient, transactionId: Hex.of(searchTerm) })
    if (transaction) {
      return {
        redirectTo: `/transaction/${transaction.id}`,
      }
    }
  }

  const isVnsDomain = searchTerm.endsWith(".vet")
  if (isVnsDomain) {
    const address = await getVnsAddress({ thorClient, networkName: activeNetwork.name, name: searchTerm })
    if (address) {
      return {
        redirectTo: `/address/${address.toString()}`,
      }
    }
  }

  throw new Error("No results found")
}
