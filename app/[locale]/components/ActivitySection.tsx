'use client'

import { Box, Flex, Grid, Heading, HStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { TableSkeleton } from '@/components/ui/Table'
import { ViewAllLink } from '@/components/ui/Links'
import { NoBlocks, NoTransactions } from '@/components/NoResults'
import { useRecentBlocksCompressed } from '@/services/veworld-indexer/recent-activity'
import { useLatestTransactionsLive } from '@/services/veworld-indexer/latest-transactions'
import { BlocksTable } from './BlocksTable'
import { ActivityTransactionsTable } from './ActivityTransactionsTable'

const ROWS_TO_DISPLAY = 5

export const ActivitySection = () => {
  const { t } = useTranslation()
  const { data: latestBlocks, isPending: blocksPending } = useRecentBlocksCompressed({ count: ROWS_TO_DISPLAY })
  const { data: txData, isPending: txPending } = useLatestTransactionsLive({ size: ROWS_TO_DISPLAY, expanded: false })

  const recentTransactions = txData?.data ?? []

  const hasNoBlocks = !blocksPending && (!latestBlocks || latestBlocks.length === 0)
  const hasNoTransactions = !txPending && recentTransactions.length === 0

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 8, md: 4 }}>
      <Card>
        <Flex justify="space-between" align="center">
          <HStack gap="3">
            <Heading as="h3" textStyle="displayXs">
              {t('Latest Blocks')}
            </Heading>
            <LiveBadge />
          </HStack>
          <ViewAllLink href="/activity/blocks">{t('View all')}</ViewAllLink>
        </Flex>
        <Box minHeight="320px">
          {blocksPending ? <TableSkeleton /> : hasNoBlocks ? <NoBlocks /> : <BlocksTable blocks={latestBlocks ?? []} />}
        </Box>
      </Card>

      <Card>
        <Flex justify="space-between" align="center">
          <HStack gap="3">
            <Heading as="h3" textStyle="displayXs">
              {t('Latest Transactions')}
            </Heading>
            <LiveBadge />
          </HStack>
          <ViewAllLink href="/activity/transactions">{t('View all')}</ViewAllLink>
        </Flex>
        <Box minHeight="320px">
          {txPending ? (
            <TableSkeleton />
          ) : hasNoTransactions ? (
            <NoTransactions />
          ) : (
            <ActivityTransactionsTable transactions={recentTransactions} />
          )}
        </Box>
      </Card>
    </Grid>
  )
}
