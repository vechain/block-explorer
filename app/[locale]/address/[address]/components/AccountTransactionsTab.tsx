import { Stack } from '@chakra-ui/react'
import { useState } from 'react'
import { NoTransactions } from '@/components/NoResults'
import { Pagination } from '@/components/ui-legacy/Pagination'
import type { AddressString } from '@/lib/schemas'
import { useAccountTransactions } from '@/services/veworld-indexer/hooks'
import { TransactionsTable } from './TransactionsTable'

const PAGE_SIZE = 30

export const AccountTransactionsTab = ({ address }: { address: AddressString }) => {
  const [page, setPage] = useState(0)
  const { data: transactions, isLoading } = useAccountTransactions({
    params: { origin: address, page, size: PAGE_SIZE },
  })

  if (isLoading) return <div>Loading...</div>
  if (!transactions || transactions.data.length === 0) return <NoTransactions />

  return (
    <Stack>
      <TransactionsTable address={address} transactions={transactions.data} />
      <Pagination page={page} hasNext={transactions.pagination.hasNext} onPageChange={setPage} />
    </Stack>
  )
}
