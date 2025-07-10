import { useNavigate, useParams } from "react-router-dom"

import { ClauseDetails } from "@/components/transactions/ClauseDetails.tsx"
import { parseHex } from "@/utils/hex"

export function ClauseDetailsPage() {
  const { transactionId, clauseIndex } = useParams<{ transactionId: string; clauseIndex: string }>()
  const navigate = useNavigate()
  const txIdHex = parseHex(transactionId)

  if (!txIdHex || clauseIndex === undefined) {
    navigate("/404")
    return null
  }

  const clauseIndexNumber = parseInt(clauseIndex)

  if (isNaN(clauseIndexNumber)) {
    navigate("/404")
    return null
  }

  return <ClauseDetails transactionId={txIdHex} clauseIndex={clauseIndexNumber} />
}
