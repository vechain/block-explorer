import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ACCOUNT_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { Address } from "@vechain/sdk-core"
import { Card } from "@chakra-ui/react"

const AccountPage = () => {
  const { address } = useParams<{ address: string }>()
  const { thorClient, selectedNetwork } = useNetwork()

  const { data: account, isLoading: isLoading } = useQuery({
    queryKey: [ACCOUNT_KEY, selectedNetwork.name],
    queryFn: async () => {
      if (!address) return null
      return thorClient.accounts.getAccount(Address.of(address))
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
