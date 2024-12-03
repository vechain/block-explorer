import { Card, Text } from "@chakra-ui/react"
import { AccountResponse } from "@/hooks/accounts/useAccountsQuery.ts"

export const AccountDetails = ({ account }: { account: AccountResponse }) => {
  return (
    <Card.Root>
      <Card.Header>
        {account.details.hasCode ? "Contract" : "Account"}: {account.vns ? account.vns : ""}{" "}
        {account.address.toString()}
      </Card.Header>
      <Card.Body>
        <Text>VET {account.details.vet.toString()}</Text>
        <Text>VTHO {account.details.vtho.toString()}</Text>
      </Card.Body>
    </Card.Root>
  )
}
