'use client'

import { Box, Flex, Heading } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { ViewAllLink } from '@/components/ui/Links'
import { NoBlocks, NoTransactions } from '@/components/NoResults'
import { useRecentBlocksExpanded } from '@/services/veworld-indexer/hooks'
import { BlocksTable } from './BlocksTable'
import { ActivityTransactionsTable } from './ActivityTransactionsTable'

const BLOCKS_TO_DISPLAY = 5

type ActivityView = 'blocks' | 'transactions'

export const ActivitySection = () => {
  const { t } = useTranslation()
  const [selectedView, setSelectedView] = useState<ActivityView>('blocks')
  const { data: latestBlocks, isPending } = useRecentBlocksExpanded({ count: BLOCKS_TO_DISPLAY })

  const viewOptions: ToggleOption<ActivityView>[] = [
    { value: 'blocks', label: t('Blocks') },
    { value: 'transactions', label: t('Transactions') },
  ]

  // Extract transactions from blocks
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

  const viewAllHref = selectedView === 'blocks' ? '/activity/blocks' : '/activity/transactions'

  const hasNoBlocks = !isPending && (!latestBlocks || latestBlocks.length === 0)
  const hasNoTransactions = !isPending && recentTransactions.length === 0

  const renderContent = () => {
    if (isPending) return <TableSkeleton />

    switch (selectedView) {
      case 'blocks':
        if (hasNoBlocks) return <NoBlocks />
        return <BlocksTable blocks={latestBlocks ?? []} />
      case 'transactions':
        if (hasNoTransactions) return <NoTransactions />
        return <ActivityTransactionsTable transactions={recentTransactions} />
    }
  }

  return (
    <Card>
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <Heading as="h3" textStyle="displayXs">
          {t('Activity')}
        </Heading>
        <ToggleGroup
          options={viewOptions}
          value={selectedView}
          onChange={setSelectedView}
          layoutId="activity-view"
          size="sm"
        />
        <ViewAllLink href={viewAllHref}>{t('View all')}</ViewAllLink>
      </Flex>
      <Box minHeight="320px">{renderContent()}</Box>
    </Card>
  )
}
