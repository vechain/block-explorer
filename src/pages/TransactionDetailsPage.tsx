import { useNavigate, useParams } from "react-router-dom"
import { TransactionDetails } from "@/components/transactions/TransactionDetails.tsx"
import { parseHex } from "@/utils/hex"

export const TransactionDetailsPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>()
  const navigate = useNavigate()

  const hex = parseHex(transactionId)

  if (!hex) {
    navigate("/404")
    return null
  }

  return <TransactionDetails id={hex} />
}
