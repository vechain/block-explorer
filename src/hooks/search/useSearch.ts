import { useCallback } from "react"
import { useBlockQuery } from "@/hooks/blocks/useBlockQuery.ts"
import { useTransactionQuery } from "@/hooks/transactions/useTransactionQuery.ts"
import { useAccountsQuery } from "@/hooks/accounts/useAccountsQuery.ts"
import { useVnsQuery } from "@/hooks/vns/useVnsQuery.ts"

interface SearchResult {
  redirectTo: string
  error?: string
}

type UseSearch = {
  search: (searchTerm: string) => Promise<SearchResult>
}

export const useSearch = (): UseSearch => {
  const { getBlock } = useBlockQuery()
  const { getTransaction } = useTransactionQuery()
  const { getAccount } = useAccountsQuery()
  const { getVnsAddress } = useVnsQuery()

  const search = useCallback(
    async (searchTerm: string): Promise<SearchResult> => {
      // Check if it's a block
      const block = await getBlock(searchTerm)
      if (block) {
        return {
          redirectTo: `/block/${block.id}`,
        }
      }

      // Check if it's a transaction
      const transaction = await getTransaction(searchTerm)
      if (transaction) {
        return {
          redirectTo: `/transaction/${transaction.id}`,
        }
      }

      // Check if it's an address
      const account = await getAccount(searchTerm)
      if (account) {
        return {
          redirectTo: `/account/${account.address}`,
        }
      }

      // Search by VNS domain
      const address = await getVnsAddress(searchTerm)
      if (address) {
        return {
          redirectTo: `/account/${address.toString()}`,
        }
      }

      // No results found, return an error
      return {
        redirectTo: "",
        error: "No results found",
      }
    },
    [getAccount, getBlock, getTransaction],
  )

  return {
    search,
  }
}
