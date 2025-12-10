import type { Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { TransactionClauses } from './TransactionClauses'
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
    return <TransactionClauses transaction={transaction} receipt={receipt} />
  }

  return <TransactionInsight transaction={transaction} receipt={receipt} />
}
