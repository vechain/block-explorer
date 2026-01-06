'use client'

import { Flex, Grid, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/hooks'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useAccountTokens } from '@/hooks/useAccountTokens'
import { useVnsName } from '@/services/thor/hooks'
import { TokenBalanceSection } from './sections/TokenBalanceSection'
import { TokenValueSection } from './sections/TokenValueSection'

export const AccountSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const { data: vnsName } = useVnsName(address)
  const { data: overview, isPending: isOverviewPending } = useAccountOverview(address)
  const {
    tokenBalanceRows,
    tokenValueRows,
    totalValue,
    isPending: isPendingTokens,
    isPendingAll: isPendingAllTokens,
  } = useAccountTokens(address)

  const isPending = isOverviewPending || isPendingTokens

  const firstSeenDate = overview ? formatDate(overview.firstSeen) : ''
  const lastSeenDate = overview ? formatDate(overview.lastSeen) : ''

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Account')}
          </Heading>
          <IDChip value={address} vnsName={vnsName} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          <DataCard
            variant="secondary"
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('First Seen')}
            tooltip={t('Information coming soon')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {firstSeenDate}
              </Text>
            )}
          </DataCard>

          <DataCard
            variant="secondary"
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('Last Seen')}
            tooltip={t('Information coming soon')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {lastSeenDate}
              </Text>
            )}
          </DataCard>

          <DataCard
            variant="secondary"
            icon={<Image src="/icons/transaction.svg" alt="Transactions" />}
            title={t('Total Transactions')}
            tooltip={t('Information coming soon')}
            pb={0}
          >
            {isPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary" mb={0}>
                {overview ? formatNumber(overview.transactionsSent) : '0'}
              </Text>
            )}
          </DataCard>

          <DataCard
            variant="secondary"
            icon={<Image src="/icons/clause.svg" alt="Clauses" />}
            title={t('Total Clauses')}
            tooltip={t('Information coming soon')}
            pb={0}
          >
            {isPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary" mb={0}>
                {overview ? formatNumber(overview.clausesSent) : '0'}
              </Text>
            )}
          </DataCard>
        </Flex>

        <Card variant="secondary" borderRadius="md" mt={4}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 5, md: 5 }}>
            <TokenBalanceSection tokenBalanceRows={tokenBalanceRows} isPending={isPendingTokens} />
            <TokenValueSection tokenValueRows={tokenValueRows} totalValue={totalValue} isPending={isPendingAllTokens} />
          </Grid>
        </Card>
      </Card>
    </Stack>
  )
}
