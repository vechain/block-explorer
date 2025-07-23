import { Flex, Stack, Table, Tabs } from "@chakra-ui/react"

import { GetAccountReturnType } from "@/services/thor/account/account"
import { VnsBadge } from "@/components/ui/VnsBadge"
import { VETBalance, VTHOBalance } from "@/components/ui/TokenBalance"
import { Subtitle, Title } from "@/components/ui/Typography"
import { CopyToClipBoard } from "@/components/ui/CopyToClipBoard"
import { useVnsName } from "@/services/thor/vns/hooks"
import { AccountTransactionsTab } from "./AccountTransactionsTab"

import { LuArrowLeftRight, LuCoins } from "react-icons/lu"
import { TbTransfer } from "react-icons/tb"

export const AccountDetails = ({ account }: { account: GetAccountReturnType }) => {
  const { data: vnsName } = useVnsName(account.address)

  const items = [
    { name: "VNS", value: <VnsBadge size="md" address={account.address} vnsName={vnsName} /> },
    { name: "Balance", value: <VETBalance balance={account.vet.wei} /> },
    { name: "VTHO / Energy", value: <VTHOBalance balance={account.vtho.wei} /> },
  ]

  return (
    <Stack flex={1}>
      <Title>Account</Title>
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

      <Tabs.Root lazyMount defaultValue="transactions" variant="enclosed" fitted>
        <Tabs.List bg="bg.muted" rounded="l3">
          <Tabs.Trigger value="transactions">
            <LuArrowLeftRight />
            Transactions
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers">
            <TbTransfer />
            Transfers
          </Tabs.Trigger>
          <Tabs.Trigger disabled value="tokens">
            <LuCoins />
            Tokens
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <AccountTransactionsTab address={account.address} />
        <Tabs.Content value="transfers">Transfers list</Tabs.Content>
        <Tabs.Content value="tokens">Tokens list</Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
