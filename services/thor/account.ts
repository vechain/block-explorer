import { Address } from '@vechain/sdk-core'
import { ThorClient } from '@vechain/sdk-network'
import { NETWORKS, type NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { accountSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'

export const accountQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [getAccount.name, networkName, address],
  queryFn: () => getAccount({ networkName, address }),
  staleTime: Infinity,
})

export const getAccount = async ({ networkName, address }: { networkName: NetworkName; address: AddressString }) => {
  const thorClient = ThorClient.at(NETWORKS[networkName].url)
  const account = await thorClient.accounts.getAccount(Address.of(address))

  if (!account) return null

  const accountData = {
    address,
    balance: account.balance,
    energy: account.energy,
    hasCode: account.hasCode,
    vet: account.vet.wei,
    vtho: account.vtho.wei,
  }

  return zodParse({
    data: accountData,
    schema: accountSchema,
    errorMessage: 'Failed to parse account',
    fallbackData: null,
  })
}
