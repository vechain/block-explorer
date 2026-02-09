'use client'

import { Flex, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/hooks'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useAccountTokens } from '@/hooks/useAccountTokens'
import { useVnsName } from '@/services/thor/hooks'
import { TokensSection } from './sections/TokensSection'
import { StakingSection } from './sections/StakingSection'

export const AccountSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const { data: vnsName } = useVnsName(address)
  const { data: overview, isPending: isOverviewPending } = useAccountOverview(address)
  const { tokenBalanceRows, tokenValueRows, totalValue, isPendingAll: isPendingAllTokens } = useAccountTokens(address)

  const firstSeenDate = overview && overview.firstSeen > 0 ? formatDate(overview.firstSeen * 1000) : null
  const lastSeenDate = overview && overview.lastSeen > 0 ? formatDate(overview.lastSeen * 1000) : null

  const accountDataCards: DataCardGroupItem[] = [
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

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Account')}
          </Heading>
          <IDChip value={address} vnsName={vnsName} />
        </Flex>

        <DataCardGroup variant="outline" items={accountDataCards} desktopColumns={4} />

        <TokensSection
          tokenBalanceRows={tokenBalanceRows}
          tokenValueRows={tokenValueRows}
          totalValue={totalValue}
          isPending={isPendingAllTokens}
        />

        <StakingSection address={address} />
      </Card>
    </Stack>
  )
}
