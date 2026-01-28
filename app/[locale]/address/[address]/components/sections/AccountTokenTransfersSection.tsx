'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heading } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { TableSkeleton } from '@/components/ui/Table'
import { NoTokenTransfers } from '@/components/NoResults'
import type { AddressString } from '@/lib/schemas'
import { useAccountTransfers } from '@/services/veworld-indexer/hooks'
import { TransfersTable } from '@/components/TransfersTable'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export const AccountTokenTransfersSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: transfers, isLoading } = useAccountTransfers({
    params: {
      address,
      page,
      size: pageSize,
    },
  })

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const hasTransfers = (transfers?.data?.length ?? 0) > 0
  const showPagination = transfers && (hasTransfers || transfers.pagination.hasNext || page > 0)

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Token Transfers')}
      </Heading>

      {isLoading ? (
        <TableSkeleton />
      ) : hasTransfers ? (
        <TransfersTable transfers={transfers?.data ?? []} />
      ) : (
        <NoTokenTransfers />
      )}

      {showPagination && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={transfers?.pagination.hasNext ?? false}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </Card>
  )
}
