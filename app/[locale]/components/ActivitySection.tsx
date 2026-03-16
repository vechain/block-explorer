'use client'

import { Box, Flex, Grid, Heading } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { ViewAllLink } from '@/components/ui/Links'
import { NoBlocks, NoTransactions } from '@/components/NoResults'
import { useRecentBlocksExpanded } from '@/services/veworld-indexer/recent-activity'
import { BlocksTable } from './BlocksTable'
import { ActivityTransactionsTable } from './ActivityTransactionsTable'

const BLOCKS_TO_DISPLAY = 5

export const ActivitySection = () => {
  const { t } = useTranslation()
  const { data: latestBlocks, isPending } = useRecentBlocksExpanded({ count: BLOCKS_TO_DISPLAY })

  const recentTransactions = useMemo(() => {
    if (!latestBlocks || latestBlocks.length === 0) return []

    return latestBlocks
      .flatMap(block =>
        block.transactions.map(tx => ({
          ...tx,
          blockNumber: block.number,
          blockTimestamp: block.timestamp,
        })),
      )
      .slice(0, 5)
  }, [latestBlocks])

  const hasNoBlocks = !isPending && (!latestBlocks || latestBlocks.length === 0)
  const hasNoTransactions = !isPending && recentTransactions.length === 0

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
      <Card>
        <Flex justify="space-between" align="center">
          <Heading as="h3" textStyle="displayXs">
            {t('Blocks')}
          </Heading>
          <ViewAllLink href="/activity/blocks">{t('View all')}</ViewAllLink>
        </Flex>
        <Box minHeight="320px">
          {isPending ? <TableSkeleton /> : hasNoBlocks ? <NoBlocks /> : <BlocksTable blocks={latestBlocks ?? []} />}
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
          {isPending ? (
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
