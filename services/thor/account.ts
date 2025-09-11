import { Address } from '@vechain/sdk-core'
import type { ThorClient } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { accountSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'

export const accountQueryOptions = (thorClient: ThorClient, networkName: NetworkName, address: AddressString) => ({
  queryKey: [getAccount.name, networkName, address],
  queryFn: () => getAccount({ thorClient, address }),
  staleTime: Infinity,
})

export const getAccount = async ({ thorClient, address }: { thorClient: ThorClient; address: AddressString }) => {
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
  })
}
