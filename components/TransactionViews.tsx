import type { Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { TransactionClauses } from './TransactionClauses'
import { TransactionEvents } from './TransactionEvents'
import { TransactionDetailsView } from '@/lib/types'

export function TransactionViews({
  transaction,
  receipt,
  view = TransactionDetailsView.CLAUSES,
}: {
  view: TransactionDetailsView
  transaction: Transaction
  receipt: TransactionReceipt | null
}) {
  if (view === TransactionDetailsView.EVENTS) {
    return <TransactionEvents receipt={receipt} />
  }

  return <TransactionClauses transaction={transaction} receipt={receipt} />
}
