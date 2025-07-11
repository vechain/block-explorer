import { Address } from "@vechain/sdk-core"
import { AccountDetail, ThorClient } from "@vechain/sdk-network"

type GetAccountReturnType = {
  address: string
  details: AccountDetail
}

export async function getAccount({
  thorClient,
  address,
}: {
  thorClient: ThorClient
  address: Address
}): Promise<GetAccountReturnType | null> {
  const accountDetails = await thorClient.accounts.getAccount(address)

  if (!accountDetails) return null

  const result = {
    address: address.toString(),
    details: accountDetails,
  } satisfies GetAccountReturnType

  return result
}
