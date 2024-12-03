import { AccountDetail } from "@vechain/sdk-network"
import { useCallback } from "react"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { Address } from "@vechain/sdk-core"
import { useVnsQuery } from "@/hooks/vns/useVnsQuery.ts"

export type AccountResponse = {
  address: Address
  details: AccountDetail
  vns: string | null
}

type UseAccountsQuery = {
  getAccount: (address: string) => Promise<AccountResponse | null>
}

export const useAccountsQuery = (): UseAccountsQuery => {
  const { thorClient } = useNetwork()
  const { getVnsName } = useVnsQuery()

  const getAccount = useCallback(
    async (address: string): Promise<AccountResponse | null> => {
      let result: AccountResponse | null = null

      try {
        const addr = Address.of(address)
        const acctDetails = await thorClient.accounts.getAccount(addr)
        if (!acctDetails) return null
        const vnsName = await getVnsName(addr)
        result = {
          address: addr,
          details: acctDetails,
          vns: vnsName,
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // No need to log as errors are expected
        // console.error("Failed to fetch account", error)
      }
      return result
    },
    [thorClient, getVnsName],
  )

  return {
    getAccount,
  }
}
