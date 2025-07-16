import { Card, Text, Link as ChakraLink } from "@chakra-ui/react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { Link as RouterLink } from "react-router-dom"

export const BlockSummary = ({ block }: { block: ExpandedBlockDetail }) => {
  const clauseCount = block.transactions.reduce((count, tx) => count + tx.clauses.length, 0)

  return (
    <Card.Root>
      <Card.Header asChild>
        <ChakraLink asChild>
          <RouterLink to={`/block/${block.id}`}>{block.id}</RouterLink>
        </ChakraLink>
      </Card.Header>
      <Card.Body>
        <Text>No: {block.number.toLocaleString()}</Text>
        <Text>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</Text>
        <Text>Transactions: {block.transactions?.length ?? 0}</Text>
        <Text>Clauses: {clauseCount}</Text>
      </Card.Body>
    </Card.Root>
  )
}
