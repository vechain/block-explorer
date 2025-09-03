import { Address } from '@vechain/sdk-core'
import type { ThorClient } from '@vechain/sdk-network'
import { z } from 'zod'
import type { NetworkName } from '@/lib/constants/network'
import { addressStringSchema, hexStringSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'

export const accountQueryOptions = (thorClient: ThorClient, networkName: NetworkName, address: Address) => ({
  queryKey: [getAccount.name, networkName, address.toString()],
  queryFn: () => getAccount({ thorClient, address }),
  staleTime: Infinity,
})

export const getAccount = async ({ thorClient, address }: { thorClient: ThorClient; address: Address }) => {
  const account = await thorClient.accounts.getAccount(Address.of(address))

  if (!account) return null

  const accountData = {
    address: address.toString(),
    balance: account.balance,
    energy: account.energy,
    hasCode: account.hasCode,
    vet: account.vet.wei,
    vtho: account.vtho.wei,
  }

  return zodParse(accountData, accountSchema)
}

export type GetAccountReturnType = z.infer<typeof accountSchema>

const accountSchema = z.object({
  address: addressStringSchema,
  balance: hexStringSchema,
  energy: hexStringSchema,
  hasCode: z.boolean(),
  vet: z.bigint(),
  vtho: z.bigint(),
})
