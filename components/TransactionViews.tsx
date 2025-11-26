import { Box } from '@chakra-ui/react'
import type { Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { TransactionInsight } from './TransactionInsights'

type View = 'transaction' | 'clauses'

export function TransactionViews({
  transaction,
  receipt,
  view = 'transaction',
}: {
  view: View
  transaction: Transaction
  receipt: TransactionReceipt | null
}) {
  if (view === 'clauses') {
    return <Box h="500px">Clauses are coming soon</Box>
  }

  return <TransactionInsight transaction={transaction} receipt={receipt} />
}
