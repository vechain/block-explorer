import { useParams } from "react-router-dom"
import { useTransactionQuery } from "@/hooks/transactions/useTransactionQuery.ts"
import { useEffect, useState } from "react"
import { TransactionDetailNoRaw } from "@vechain/sdk-network"
import { ClauseDetails } from "@/components/transactions/ClauseDetails.tsx"

const ClauseDetailsPage = () => {
  const { transactionId, clauseIndex } = useParams<{ transactionId: string; clauseIndex: string }>()
  const { getTransaction } = useTransactionQuery()
  const [transaction, setTransaction] = useState<TransactionDetailNoRaw | null>(null)
  const [clauseIndexNumber, setClauseIndexNumber] = useState<number | null>(null)

  useEffect(() => {
    if (!transactionId) return
    getTransaction(transactionId).then(t => setTransaction(t))
  }, [transactionId, getTransaction])

  useEffect(() => {
    if (!clauseIndex) return
    setClauseIndexNumber(parseInt(clauseIndex, 10))
  }, [clauseIndex])

  if (!transaction || clauseIndexNumber === null) {
    return <div>Loading...</div>
  }

  return <ClauseDetails transaction={transaction} clauseIndex={clauseIndexNumber} />
}

export default ClauseDetailsPage
