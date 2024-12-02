import { Card, Text } from "@chakra-ui/react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"

export const Block = ({ block }: { block: ExpandedBlockDetail }) => {
  const clauseCount = block.transactions?.reduce((count, tx) => count + (tx.clauses?.length ?? 0), 0) ?? 0

  return (
    <Card.Root>
      <Card.Header>{block.id}</Card.Header>
      <Card.Body>
        <Text>No: {block.number.toLocaleString()}</Text>
        <Text>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</Text>
        <Text>Transactions: {block.transactions?.length ?? 0}</Text>
        <Text>Clauses: {clauseCount}</Text>
      </Card.Body>
    </Card.Root>
  )
}
