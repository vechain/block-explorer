import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ACCOUNT_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useAccountsQuery } from "@/hooks/accounts/useAccountsQuery.ts"
import { AccountDetails } from "@/components/accounts/AccountDetails.tsx"

const AccountPage = () => {
  const { address } = useParams<{ address: string }>()
  const { selectedNetwork } = useNetwork()
  const { getAccount } = useAccountsQuery()

  const { data: account, isLoading: isLoading } = useQuery({
    queryKey: [ACCOUNT_KEY, address, selectedNetwork.name],
    queryFn: async () => {
      if (!address) return null
      return getAccount(address)
    },
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: !!address,
  })

  if (isLoading || !account) return <div>Loading...</div>

  return <AccountDetails account={account} />
}

export default AccountPage
