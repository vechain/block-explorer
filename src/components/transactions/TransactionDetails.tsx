import { useNavigate } from "react-router-dom"
import { Card, List, ListItem, Text } from "@chakra-ui/react"
import { Hex } from "@vechain/sdk-core"
import { useTransaction } from "@/hooks/thor/useTransaction"

export const TransactionDetails = ({ id }: { id: Hex }) => {
  const { data: tx, isLoading } = useTransaction(id)
  const navigate = useNavigate()

  if (isLoading) return <div>Loading...</div>
  if (!tx) return <div>Transaction not found</div>

  const handleBlockClick = (blockId: string) => {
    navigate(`/block/${blockId}`)
  }

  const handleClauseClick = (txId: string, clauseIndex: number) => {
    navigate(`/transaction/${txId}/clause/${clauseIndex}`)
  }

  return (
    <Card.Root>
      <Card.Header>{tx.id}</Card.Header>
      <Card.Body>
        <Text>
          Block:{" "}
          <span onClick={() => handleBlockClick(tx.meta.blockID)} style={{ cursor: "pointer" }}>
            {tx.meta.blockID}
          </span>
        </Text>
        <Text>Gas: {tx.gas.toLocaleString()}</Text>
        <Text>Origin: {tx.origin}</Text>
        <Text>Nonce: {tx.nonce.toLocaleString()}</Text>
        <Text>Size: {tx.size.toLocaleString()}</Text>
        <Text>Clauses:</Text>
        <List.Root>
          {tx.clauses.map((clause, index) => (
            <ListItem key={index} onClick={() => handleClauseClick(tx.id, index)} style={{ cursor: "pointer" }}>
              {clause.to}
            </ListItem>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  )
}
