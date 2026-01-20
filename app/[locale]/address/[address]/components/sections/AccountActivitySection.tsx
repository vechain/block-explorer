'use client'

import { Heading, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowDownLeft, LuArrowUpRight, LuArrowLeftRight, LuLayoutGrid, LuFlame } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { VETBalance, VTHOBalance } from '@/components/ui/Balance'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/hooks'
import { useFormatNumber } from '@/hooks/useFormatting'

export const AccountActivitySection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const { data: overview } = useAccountOverview(address)
  const formatNumber = useFormatNumber()

  const topRowItems: DataCardGroupItem[] = [
    {
      icon: <LuArrowDownLeft />,
      title: t('Total VET Received'),
      children: <VETBalance balance={BigInt(overview?.vetReceived ?? '0')} />,
    },
    {
      icon: <LuArrowUpRight />,
      title: t('Total VET Sent'),
      children: <VETBalance balance={BigInt(overview?.vetSent ?? '0')} />,
    },
    {
      icon: <LuArrowLeftRight />,
      title: t('Transactions Sent'),
      children: formatNumber(overview?.transactionsSent ?? 0),
    },
  ]

  const bottomRowItems: DataCardGroupItem[] = [
    {
      icon: <LuLayoutGrid />,
      title: t('Total Clauses'),
      children: formatNumber(overview?.clausesSent ?? 0),
    },
    {
      icon: <LuFlame />,
      title: t('Total VTHO Paid'),
      children: <VTHOBalance balance={BigInt(overview?.vthoBurned ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Delegated'),
      children: <VTHOBalance balance={BigInt(overview?.vthoDelegated ?? '0')} />,
    },
  ]

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Activity')}
      </Heading>
      <Stack gap="4">
        <DataCardGroup items={topRowItems} desktopColumns={3} variant="secondary" />
        <DataCardGroup items={bottomRowItems} desktopColumns={3} variant="secondary" />
      </Stack>
    </Card>
  )
}
