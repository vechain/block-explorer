'use client'

import { Stack, Table, Tabs } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeftRight, LuCoins, LuImage } from 'react-icons/lu'
import { TbTransfer } from 'react-icons/tb'
import { VETBalance, VTHOBalance } from '@/components/ui-legacy/TokenBalance'
import { VnsBadge } from '@/components/ui-legacy/VnsBadge'
import { useTabs } from '@/hooks/useTabs'
import type { Account } from '@/lib/schemas'
import { useVnsName } from '@/services/thor/hooks'
import { AccountNftsTab } from './AccountNftTab'
import { AccountTokensTab } from './AccountTokensTab'
import { AccountTransactionsTab } from './AccountTransactionsTab'
import { AccountTransfersTab } from './AccountTransfersTab'
import { AccountSummary } from './AccountSummary'
import { AccountTransactionsSection } from './AccountTransactionsSection'

export const AccountDetails = ({ account }: { account: Account }) => {
  const { t } = useTranslation()
  const { data: vnsName } = useVnsName(account.address)
  const { currentTab, handleTabChange } = useTabs('transactions')

  const items = [
    {
      name: t('VNS'),
      value: <VnsBadge size="md" address={account.address} vnsName={vnsName} />,
    },
    { name: t('Balance'), value: <VETBalance balance={account.vet} /> },
    { name: t('VTHO / Energy'), value: <VTHOBalance balance={account.vtho} /> },
  ]

  return (
    <Stack flex={1} gap="8">
      <AccountSummary address={account.address} />
      <AccountTransactionsSection address={account.address} />

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
        <Table.Root size="md">
          <Table.Body>
            {items.map(item => (
              <Table.Row key={item.name} bg="bg-secondary">
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
          <Tabs.Trigger value="tokens">
            <LuCoins />
            {t('Tokens')}
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l3" />
          <Tabs.Trigger value="nfts">
            <LuImage />
            {t('NFTs')}
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l3" />
        </Tabs.List>

        <Tabs.Content value="transactions">
          <AccountTransactionsTab address={account.address} />
        </Tabs.Content>
        <Tabs.Content value="transfers">
          <AccountTransfersTab address={account.address} />
        </Tabs.Content>
        <Tabs.Content value="tokens">
          <AccountTokensTab address={account.address} />
        </Tabs.Content>
        <Tabs.Content value="nfts">
          <AccountNftsTab address={account.address} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
