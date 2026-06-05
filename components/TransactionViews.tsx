import type { Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { TransactionClauses } from './TransactionClauses'
import { TransactionEvents } from './TransactionEvents'
import { TransactionDetailsView } from '@/lib/types'

export function TransactionViews({
  transaction,
  receipt,
  view = TransactionDetailsView.CLAUSES,
  expert = false,
}: {
  view: TransactionDetailsView
  transaction: Transaction
  receipt: TransactionReceipt | null
  expert?: boolean
}) {
  if (view === TransactionDetailsView.EVENTS) {
    return <TransactionEvents receipt={receipt} expert={expert} />
  }

  return <TransactionClauses transaction={transaction} receipt={receipt} expert={expert} />
}
