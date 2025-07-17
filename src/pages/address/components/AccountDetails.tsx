import { Stack, Table } from "@chakra-ui/react"

import { GetAccountReturnType } from "@/actions/getAccount"
import { VnsBadge } from "@/components/ui/VnsBadge"
import { VETBalance, VTHOBalance } from "@/components/ui/TokenBalance"
import { Subtitle, Title } from "@/components/ui/Typography"

export const AccountDetails = ({ account }: { account: GetAccountReturnType }) => {
  const items = [
    { name: "VNS", value: <VnsBadge address={account.address} /> },
    { name: "Balance", value: <VETBalance balance={account.vet.wei} /> },
    { name: "VTHO / Energy", value: <VTHOBalance balance={account.vtho.wei} /> },
  ]

  return (
    <Stack flex={1}>
      <Title>Account</Title>
      <Subtitle>{account.address.toString()}</Subtitle>

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
        <Table.Root size="md">
          <Table.Body>
            {items.map(item => (
              <Table.Row key={item.name}>
                <Table.Cell>{item.name}</Table.Cell>
                <Table.Cell>{item.value}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  )
}
