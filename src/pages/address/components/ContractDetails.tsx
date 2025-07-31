import { Flex, Stack, Table, Tabs } from "@chakra-ui/react"
import { GetAccountReturnType } from "@/services/thor/account/account"
import { VETBalance, VTHOBalance } from "@/components/ui/TokenBalance"
import { Subtitle, Title } from "@/components/ui/Typography"
import { CopyToClipBoard } from "@/components/ui/CopyToClipBoard"
import { AccountTransactionsTab } from "./AccountTransactionsTab"
import { LuArrowLeftRight } from "react-icons/lu"
import { TbTransfer } from "react-icons/tb"
import { AccountTransfersTab } from "./AccountTransfersTab"

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

      <Tabs.Root defaultValue="transactions" variant="subtle">
        <Tabs.List bg="bg.muted" rounded="l3">
          <Tabs.Trigger value="transactions">
            <LuArrowLeftRight />
            Transactions
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers">
            <TbTransfer />
            Transfers
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <Tabs.Content value="transactions">
          <AccountTransactionsTab address={account.address} />
        </Tabs.Content>
        <Tabs.Content value="transfers">
          <AccountTransfersTab address={account.address} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
