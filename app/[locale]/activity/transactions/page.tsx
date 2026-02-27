'use client'

import { Box, Heading, Stack } from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { NoTransactions } from '@/components/NoResults'
import { useRecentBlocksExpanded } from '@/services/veworld-indexer/recent-activity'
import { ActivityTransactionsTable } from '../../components/ActivityTransactionsTable'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export default function AllTransactionsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  // Fetch enough blocks to get transactions - we need more blocks to get enough transactions
  const blocksToFetch = Math.max((page + 2) * pageSize, 50)
  const { data: allBlocks, isPending } = useRecentBlocksExpanded({ count: blocksToFetch })

  // Extract all transactions from blocks
  const allTransactions = useMemo(() => {
    if (!allBlocks || allBlocks.length === 0) return []

    return allBlocks.flatMap(block =>
      block.transactions.map(tx => ({
        ...tx,
        blockNumber: block.number,
        blockTimestamp: block.timestamp,
      })),
    )
  }, [allBlocks])

  // Paginate the transactions client-side
  const paginatedTransactions = useMemo(() => {
    const start = page * pageSize
    const end = start + pageSize
    return allTransactions.slice(start, end)
  }, [allTransactions, page, pageSize])

  const hasNext = useMemo(() => {
    return allTransactions.length > (page + 1) * pageSize
  }, [allTransactions, page, pageSize])

  const hasNoTransactions = !isPending && allTransactions.length === 0

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(0)
  }

  return (
    <Stack gap={8} mt={8}>
      <Card>
        <Heading as="h2" textStyle="displayXs">
          {t('Transactions')}
        </Heading>
        <Box minHeight="400px">
          {isPending ? (
            <TableSkeleton />
          ) : hasNoTransactions ? (
            <NoTransactions />
          ) : (
            <ActivityTransactionsTable transactions={paginatedTransactions} />
          )}
        </Box>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={hasNext}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>
    </Stack>
  )
}
