import { useNavigate } from "react-router-dom"
import { Card, Text } from "@chakra-ui/react"
import { TransactionDetailNoRaw } from "@vechain/sdk-network"

export const ClauseDetails = ({
  transaction,
  clauseIndex,
}: {
  transaction: TransactionDetailNoRaw
  clauseIndex: number
}) => {
  const navigate = useNavigate()
  const clause = transaction.clauses[clauseIndex]

  const handleTransactionClick = (txId: string) => {
    navigate(`/transaction/${txId}`)
  }

  const handleBlockClick = (blockId: string) => {
    navigate(`/block/${blockId}`)
  }

  return (
    <Card.Root>
      <Card.Header>Clause</Card.Header>
      <Card.Body>
        <Card.Body>
          <Text onClick={() => handleBlockClick(transaction.meta.blockID)} style={{ cursor: "pointer" }}>
            Block: {transaction.meta.blockID}
          </Text>
          <Text onClick={() => handleTransactionClick(transaction.id)} style={{ cursor: "pointer" }}>
            Tx: {transaction.id}
          </Text>
          <Text>Origin: {transaction.origin}</Text>
          <Text>To: {clause.to}</Text>
          <Text>Value: {clause.value}</Text>
          <Text>Data: {clause.data}</Text>
        </Card.Body>
      </Card.Body>
    </Card.Root>
  )
}
