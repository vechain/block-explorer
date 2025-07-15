import { useNavigate } from "react-router-dom"
import { Card, Text } from "@chakra-ui/react"
import { Hex } from "@vechain/sdk-core"
import { useTransaction } from "@/hooks/thor/useTransaction"

export const ClauseDetails = ({ transactionId, clauseIndex }: { transactionId: Hex; clauseIndex: number }) => {
  const { data: tx, isLoading } = useTransaction(transactionId)
  const navigate = useNavigate()

  if (isLoading) return <div>Loading...</div>
  if (!tx) return <div>Transaction not found</div>

  const clause = tx.clauses[clauseIndex]

  const handleTransactionClick = (txId: string) => {
    navigate(`/transaction/${txId}`)
  }

  const handleBlockClick = (blockId: string) => {
    navigate(`/block/${blockId}`)
  }

  const handleAccountClick = (address: string) => {
    navigate(`/account/${address}`)
  }

  return (
    <Card.Root>
      <Card.Header>Clause</Card.Header>
      <Card.Body>
        <Card.Body>
          <Text onClick={() => handleBlockClick(tx.meta.blockID)} style={{ cursor: "pointer" }}>
            Block: {tx.meta.blockID}
          </Text>
          <Text onClick={() => handleTransactionClick(tx.id)} style={{ cursor: "pointer" }}>
            Tx: {tx.id}
          </Text>
          <Text onClick={() => handleAccountClick(tx.origin)} style={{ cursor: "pointer" }}>
            Origin: {tx.origin}
          </Text>
          {clause.to && (
            <Text onClick={() => handleAccountClick(clause.to!)} style={{ cursor: "pointer" }}>
              To: {clause.to}
            </Text>
          )}
          <Text>Value: {clause.value}</Text>
          <Text>Data: {clause.data}</Text>
        </Card.Body>
      </Card.Body>
    </Card.Root>
  )
}
