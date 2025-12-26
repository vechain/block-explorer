import type { Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { TransactionClauses } from './TransactionClauses'
import { TransactionInsight } from './TransactionInsights'
import { TransactionEvents } from './TransactionEvents'
import { TransactionDetailsView } from '@/lib/types'

export function TransactionViews({
  transaction,
  receipt,
  view = TransactionDetailsView.TRANSACTION,
}: {
  view: TransactionDetailsView
  transaction: Transaction
  receipt: TransactionReceipt | null
}) {
  if (view === TransactionDetailsView.CLAUSES) {
    return <TransactionClauses transaction={transaction} receipt={receipt} />
  }

  if (view === TransactionDetailsView.EVENTS) {
    return <TransactionEvents receipt={receipt} />
  }

  return <TransactionInsight transaction={transaction} receipt={receipt} />
}
