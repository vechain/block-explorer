import { addressStringSchema, AddressString } from "@/utils/address"
import { Address } from "@vechain/sdk-core"
import { AccountDetail, ThorClient } from "@vechain/sdk-network"

export interface GetAccountReturnType extends AccountDetail {
  address: AddressString
}

export async function getAccount({
  thorClient,
  address,
}: {
  thorClient: ThorClient
  address: Address
}): Promise<GetAccountReturnType | null> {
  const account = await thorClient.accounts.getAccount(address)

  if (!account) return null

  return {
    ...account,
    vet: account.vet,
    vtho: account.vtho,
    address: addressStringSchema.parse(address.toString()),
  }
}
