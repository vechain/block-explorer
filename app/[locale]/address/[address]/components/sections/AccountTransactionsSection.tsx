'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { PaginationControls } from '@/components/ui/PaginationControls'
import type { AddressString } from '@/lib/schemas'
import { useAddressTransactions } from '@/services/veworld-indexer/hooks'
import { AccountTransactionsTable } from './AccountTransactionsTable'
import { Heading } from '@chakra-ui/react'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export const AccountTransactionsSection = ({ address, hasCode }: { address: AddressString; hasCode: boolean }) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: transactions, isLoading } = useAddressTransactions({
    address,
    hasCode,
    page,
    size: pageSize,
  })

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Transactions')}
      </Heading>

      <AccountTransactionsTable transactions={transactions?.data ?? []} isLoading={isLoading} />

      {transactions && transactions.data.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={transactions.pagination.hasNext}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </Card>
  )
}
