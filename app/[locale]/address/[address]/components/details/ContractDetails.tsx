import { Flex, Heading, Stack, Table, Tabs } from '@chakra-ui/react'
import { LuArrowLeftRight } from 'react-icons/lu'
import { TbTransfer } from 'react-icons/tb'
import { IDChip } from '@/components/ui/IDChip'
import { VETBalance, VTHOBalance } from '@/components/ui-legacy/TokenBalance'
import { VnsBadge } from '@/components/ui-legacy/VnsBadge'
import { useTabs } from '@/hooks/useTabs'
import type { Account } from '@/lib/schemas'
import { useVnsName } from '@/services/thor/hooks'
import { AccountTransfersTab } from '../tabs/AccountTransfersTab'
import { ContractTransactionsTab } from '../tabs/ContractTransactionsTab'
import { useTranslation } from 'react-i18next'

export const ContractDetails = ({ account }: { account: Account }) => {
  const { t } = useTranslation()
  const { data: vnsName } = useVnsName(account.address)
  const { currentTab, handleTabChange } = useTabs('transactions')

  const items = [
    { name: 'VNS', value: <VnsBadge size="md" address={account.address} vnsName={vnsName} /> },
    { name: 'Balance', value: <VETBalance balance={account.vet} /> },
    { name: 'VTHO / Energy', value: <VTHOBalance balance={account.vtho} /> },
  ]

  return (
    <Stack flex={1} gap="8">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
          {t('Contract Details')}
        </Heading>
        <IDChip value={account.address} vnsName={vnsName} />
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

      <Tabs.Root value={currentTab} onValueChange={handleTabChange} variant="subtle" lazyMount>
        <Tabs.List bg="bg.muted" rounded="l3">
          <Tabs.Trigger value="transactions">
            <LuArrowLeftRight />
            {t('Transactions')}
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers">
            <TbTransfer />
            {t('Transfers')}
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <Tabs.Content value="transactions">
          <ContractTransactionsTab address={account.address} />
        </Tabs.Content>
        <Tabs.Content value="transfers">
          <AccountTransfersTab address={account.address} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
