'use client'

import { Box, Flex, Grid, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { ViewAllLink } from '@/components/ui/Links'
import { NoBlocks, NoTransactions } from '@/components/NoResults'
import { useLiveHead } from '@/lib/live-head/provider'
import { mergeLiveBlocks } from '@/lib/live-head/store'
import { useLatestBlocksLive } from '@/services/veworld-indexer/latest-blocks'
import { useLatestTransactionsLive } from '@/services/veworld-indexer/latest-transactions'
import { BlocksTable } from './BlocksTable'
import { ActivityTransactionsTable } from './ActivityTransactionsTable'

const ROWS_TO_DISPLAY = 5

export const ActivitySection = () => {
  const { t } = useTranslation()
  const { data: blockData, isPending: blocksPending } = useLatestBlocksLive({ size: ROWS_TO_DISPLAY })
  const { data: txData, isPending: txPending } = useLatestTransactionsLive({ size: ROWS_TO_DISPLAY, expanded: false })

  const { recent } = useLiveHead()
  const latestBlocks = mergeLiveBlocks(recent, blockData?.data ?? [])
  const recentTransactions = txData?.data ?? []

  const hasNoBlocks = !blocksPending && latestBlocks.length === 0
  const hasNoTransactions = !txPending && recentTransactions.length === 0

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 8, md: 4 }}>
      <Card>
        <Flex justify="space-between" align="center">
          <Heading as="h3" textStyle="displayXs">
            {t('Blocks')}
          </Heading>
          <ViewAllLink href="/activity/blocks">{t('View all')}</ViewAllLink>
        </Flex>
        <Box minHeight="320px">
          {blocksPending ? <TableSkeleton /> : hasNoBlocks ? <NoBlocks /> : <BlocksTable blocks={latestBlocks} />}
        </Box>
      </Card>

      <Card>
        <Flex justify="space-between" align="center">
          <Heading as="h3" textStyle="displayXs">
            {t('Transactions')}
          </Heading>
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
