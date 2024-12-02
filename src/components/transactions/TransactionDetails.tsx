import { TransactionDetailNoRaw } from "@vechain/sdk-network"
import { useNavigate } from "react-router-dom"
import { Card, List, ListItem, Text } from "@chakra-ui/react"

export const TransactionDetails = ({ transaction }: { transaction: TransactionDetailNoRaw }) => {
  const navigate = useNavigate()

  const handleBlockClick = (blockId: string) => {
    navigate(`/block/${blockId}`)
  }

  const handleClauseClick = (txId: string, clauseIndex: number) => {
    navigate(`/transaction/${txId}/clause/${clauseIndex}`)
  }

  return (
    <Card.Root>
      <Card.Header>{transaction.id}</Card.Header>
      <Card.Body>
        <Text>
          Block:{" "}
          <span onClick={() => handleBlockClick(transaction.meta.blockID)} style={{ cursor: "pointer" }}>
            {transaction.meta.blockID}
          </span>
        </Text>
        <Text>Gas: {transaction.gas.toLocaleString()}</Text>
        <Text>Origin: {transaction.origin}</Text>
        <Text>Nonce: {transaction.nonce.toLocaleString()}</Text>
        <Text>Size: {transaction.size.toLocaleString()}</Text>
        <Text>Clauses:</Text>
        <List.Root>
          {transaction.clauses?.map((clause, index) => (
            <ListItem
              key={index}
              onClick={() => handleClauseClick(transaction.id, index)}
              style={{ cursor: "pointer" }}>
              {clause.to}
            </ListItem>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  )
}
