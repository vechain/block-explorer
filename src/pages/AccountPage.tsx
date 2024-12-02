import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ACCOUNT_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { Card } from "@chakra-ui/react"
import { useAccountsQuery } from "@/hooks/accounts/useAccountsQuery.ts"

const AccountPage = () => {
  const { address } = useParams<{ address: string }>()
  const { selectedNetwork } = useNetwork()
  const { getAccount } = useAccountsQuery()

  const { data: account, isLoading: isLoading } = useQuery({
    queryKey: [ACCOUNT_KEY, selectedNetwork.name],
    queryFn: async () => {
      if (!address) return null
      return getAccount(address)
    },
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!address,
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <Card.Root>
      <Card.Header>Account</Card.Header>
      <Card.Body>
        <pre>{JSON.stringify(account, null, 2)}</pre>
      </Card.Body>
    </Card.Root>
  )
}

export default AccountPage
