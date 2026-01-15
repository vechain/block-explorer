'use client'

import { Box, Center, Heading, Stack, Text } from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { useRecentNFTTransfers } from '@/services/veworld-indexer/hooks'
import { NFTTransfersTable } from '../../components/NFTTransfersTable'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export default function NFTTransfersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  // Fetch enough transfers to support pagination
  const totalToFetch = (page + 2) * pageSize
  const { data: allTransfers, isPending } = useRecentNFTTransfers({ count: totalToFetch })

  // Paginate the transfers client-side
  const paginatedTransfers = useMemo(() => {
    if (!allTransfers) return []
    const start = page * pageSize
    const end = start + pageSize
    return allTransfers.slice(start, end)
  }, [allTransfers, page, pageSize])

  const hasNext = useMemo(() => {
    if (!allTransfers) return false
    return allTransfers.length > (page + 1) * pageSize
  }, [allTransfers, page, pageSize])

  const hasNoTransfers = !isPending && (!allTransfers || allTransfers.length === 0)

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(0)
  }

  return (
    <Stack gap={8} mt={8}>
      <Card>
        <Heading as="h2" textStyle="displayXs">
          {t('NFT Transfers')}
        </Heading>
        <Box minHeight="400px">
          {isPending ? (
            <TableSkeleton />
          ) : hasNoTransfers ? (
            <Center h="400px">
              <Text color="text-secondary">{t('No transfers')}</Text>
            </Center>
          ) : (
            <NFTTransfersTable transfers={paginatedTransfers} />
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
