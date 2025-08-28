import { addressStringSchema, hexStringSchema } from "@/schemas"
import { zodParse } from "@/utils/zod"
import { Address } from "@vechain/sdk-core"

import { ThorClient } from "@vechain/sdk-network"
import { z } from "zod"

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

export const accountSchema = z.object({
  address: addressStringSchema,
  balance: hexStringSchema,
  energy: hexStringSchema,
  hasCode: z.boolean(),
  vet: z.bigint(),
  vtho: z.bigint(),
})
