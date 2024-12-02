import { AccountDetail } from "@vechain/sdk-network"
import { useCallback } from "react"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { Address } from "@vechain/sdk-core"

export type AccountResponse = {
  address: Address
  details: AccountDetail
  vns?: string
}

type UseAccountsQuery = {
  getAccount: (address: string) => Promise<AccountResponse | null>
}

export const useAccountsQuery = (): UseAccountsQuery => {
  const { thorClient } = useNetwork()

  const getAccount = useCallback(
    async (address: string): Promise<AccountResponse | null> => {
      let result: AccountResponse | null = null

      try {
        const addr = Address.of(address)
        const acctDetails = await thorClient.accounts.getAccount(addr)
        if (!acctDetails) return null
        result = {
          address: addr,
          details: acctDetails,
        }
      } catch (error) {
        console.error("Failed to fetch account", error)
      }
      return result
    },
    [thorClient],
  )

  return {
    getAccount,
  }
}
