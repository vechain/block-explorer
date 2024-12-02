import { useParams } from "react-router-dom"
import { useTransactionQuery } from "@/hooks/transactions/useTransactionQuery.ts"
import { TransactionDetailNoRaw } from "@vechain/sdk-network"
import { useEffect, useState } from "react"
import { TransactionDetails } from "@/components/transactions/TransactionDetails.tsx"

const TransactionDetailsPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>()
  const { getTransaction } = useTransactionQuery()
  const [transaction, setTransaction] = useState<TransactionDetailNoRaw | null>(null)

  useEffect(() => {
    if (!transactionId) return
    getTransaction(transactionId).then(t => setTransaction(t))
  }, [transactionId, getTransaction])

  if (!transaction) return <div>Loading...</div>

  return <TransactionDetails transaction={transaction} />
}

export default TransactionDetailsPage
