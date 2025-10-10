import { useMutation } from '@tanstack/react-query'
import type { Network } from '@/lib/constants/network'
import { addressStringSchema, blockRevisionSchema, hexStringSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getAccount } from '@/services/thor/account'
import { getBlock } from '@/services/thor/block'
import { getTransaction } from '@/services/thor/transaction'
import { getVnsAddress } from '@/services/thor/vns'

export const useSearch = () => {
  const { activeNetwork } = useSettingsStore()

  return useMutation({
    mutationFn: (searchTerm: string) => search({ searchTerm, activeNetwork }),
  })
}

const search = async ({
  searchTerm,
  activeNetwork,
}: {
  searchTerm: string
  activeNetwork: Network
}): Promise<{ redirectTo: string }> => {
  const parsedAddress = addressStringSchema.safeParse(searchTerm)
  if (parsedAddress.success) {
    const account = await getAccount({
      networkName: activeNetwork.name,
      address: parsedAddress.data,
    })
    if (account) {
      return {
        redirectTo: `/address/${account.address}`,
      }
    }
  }

  const result = blockRevisionSchema.safeParse(searchTerm)
  const isBlock = result.success
  if (isBlock) {
    const block = await getBlock({ networkName: activeNetwork.name, revision: result.data })
    if (block) {
      return {
        redirectTo: `/block/${block.id}`,
      }
    }
  }

  const parsedHex = hexStringSchema.safeParse(searchTerm)
  if (parsedHex.success) {
    const transaction = await getTransaction({ networkName: activeNetwork.name, transactionId: parsedHex.data })
    if (transaction) {
      return {
        redirectTo: `/transaction/${transaction.id}`,
      }
    }
  }

  const isVnsDomain = searchTerm.endsWith('.vet')
  if (isVnsDomain) {
    const address = await getVnsAddress({ networkName: activeNetwork.name, name: searchTerm })
    if (address) {
      return {
        redirectTo: `/address/${address}`,
      }
    }
  }

  throw new Error('No results found')
}
