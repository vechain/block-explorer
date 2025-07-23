import { Flex, Stack, Table } from "@chakra-ui/react"
import { GetAccountReturnType } from "@/services/thor/account/account"
import { VETBalance, VTHOBalance } from "@/components/ui/TokenBalance"
import { Subtitle, Title } from "@/components/ui/Typography"
import { CopyToClipBoard } from "@/components/ui/CopyToClipBoard"

export const ContractDetails = ({ account }: { account: GetAccountReturnType }) => {
  const items = [
    { name: "Balance", value: <VETBalance balance={account.vet.wei} /> },
    { name: "VTHO / Energy", value: <VTHOBalance balance={account.vtho.wei} /> },
  ]

  return (
    <Stack flex={1}>
      <Title>Contract Details</Title>
      <Flex alignItems="center" gap={2}>
        <Subtitle>{account.address.toString()}</Subtitle>
        <CopyToClipBoard value={account.address.toString()} />
      </Flex>

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
