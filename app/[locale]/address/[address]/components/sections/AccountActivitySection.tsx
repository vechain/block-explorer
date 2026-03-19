'use client'

import { Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { LuArrowDownLeft, LuArrowUpRight, LuFlame } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { Balance, VETBalance, VTHOBalance } from '@/components/ui/Balance'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/account-overview'

export const AccountActivitySection = ({
  address,
  showSummaryCards = false,
}: {
  address: AddressString
  showSummaryCards?: boolean
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const { data: overview, isPending: isOverviewPending } = useAccountOverview(address)

  const firstSeenDate = overview && overview.firstSeen > 0 ? formatDate(overview.firstSeen * 1000) : null
  const lastSeenDate = overview && overview.lastSeen > 0 ? formatDate(overview.lastSeen * 1000) : null

  const items: DataCardGroupItem[] = [
    ...(showSummaryCards
      ? [
          {
            icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
            title: t('First Seen'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color={firstSeenDate ? 'text-primary' : 'text-secondary'}>
                {firstSeenDate ?? '-'}
              </Text>
            ),
          },
          {
            icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
            title: t('Last Seen'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color={lastSeenDate ? 'text-primary' : 'text-secondary'}>
                {lastSeenDate ?? '-'}
              </Text>
            ),
          },
          {
            icon: <Image src="/icons/transaction.svg" alt="Transactions" width={24} height={24} />,
            title: t('Total Transactions'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {overview ? formatNumber(overview.transactionsSent) : '0'}
              </Text>
            ),
          },
          {
            icon: <Image src="/icons/clause.svg" alt="Clauses" width={24} height={24} />,
            title: t('Total Clauses'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {overview ? formatNumber(overview.clausesSent) : '0'}
              </Text>
            ),
          },
        ]
      : []),
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
      icon: <LuFlame />,
      title: t('Gas Used'),
      children: <Balance balance={BigInt(overview?.gasUsed ?? '0')} symbol="VTHO" decimals={5} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Burned'),
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
        <DataCardGroup items={items} desktopColumns={3} />
      </Stack>
    </Card>
  )
}
