'use client'

import { Box, Heading, Stack } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { NoTransactions } from '@/components/NoResults'
import { useLatestTransactions } from '@/services/veworld-indexer/latest-transactions'
import { ActivityTransactionsTable } from '../../components/ActivityTransactionsTable'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export default function AllTransactionsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useLatestTransactions({
    size: pageSize,
    expanded: false,
  })

  const pages = data?.pages ?? []
  const currentPageData = pages[page]?.data ?? []
  const hasNext = page < pages.length - 1 || Boolean(hasNextPage)

  const hasNoTransactions = !isPending && pages.length > 0 && pages.every(p => p.data.length === 0)

  const handlePageChange = async (newPage: number) => {
    if (newPage > pages.length - 1 && hasNextPage && !isFetchingNextPage) {
      await fetchNextPage()
    }
    setPage(newPage)
  }

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
            <ActivityTransactionsTable transactions={currentPageData} showDetails />
          )}
        </Box>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={hasNext}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>
    </Stack>
  )
}
