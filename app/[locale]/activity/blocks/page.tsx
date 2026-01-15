'use client'

import { Box, Heading, Stack } from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { useRecentBlocksExpanded } from '@/services/veworld-indexer/hooks'
import { BlocksTable } from '../../components/BlocksTable'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export default function AllBlocksPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  // Fetch enough blocks to support pagination
  const totalToFetch = (page + 2) * pageSize
  const { data: allBlocks, isPending } = useRecentBlocksExpanded({ count: totalToFetch })

  // Paginate the blocks client-side
  const paginatedBlocks = useMemo(() => {
    if (!allBlocks) return []
    const start = page * pageSize
    const end = start + pageSize
    return allBlocks.slice(start, end)
  }, [allBlocks, page, pageSize])

  const hasNext = useMemo(() => {
    if (!allBlocks) return false
    return allBlocks.length > (page + 1) * pageSize
  }, [allBlocks, page, pageSize])

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(0)
  }

  return (
    <Stack gap={8} mt={8}>
      <Card>
        <Heading as="h2" textStyle="displayXs">
          {t('Blocks')}
        </Heading>
        <Box minHeight="400px">{isPending ? <TableSkeleton /> : <BlocksTable blocks={paginatedBlocks} />}</Box>
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
