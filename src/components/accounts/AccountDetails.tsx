import { Card, Text } from "@chakra-ui/react"
import { Address } from "@vechain/sdk-core"
import { useVnsName } from "@/hooks/thor/useVnsName"
import { useAccount } from "@/hooks/thor/useAccount"

export const AccountDetails = ({ address }: { address: Address }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)
  const { data: vnsName, isLoading: isVnsLoading } = useVnsName(address)

  if (isAccountLoading || isVnsLoading) return <div>Loading...</div>

  if (!account) {
    return <div>Account not found</div>
  }

  return (
    <Card.Root>
      <Card.Header>
        {account.details.hasCode ? "Contract" : "Account"}: {vnsName ?? ""}
        {account.address.toString()}
      </Card.Header>
      <Card.Body>
        <Text>VET {account.details.vet.toString()}</Text>
        <Text>VTHO {account.details.vtho.toString()}</Text>
      </Card.Body>
    </Card.Root>
  )
}
