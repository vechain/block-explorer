import { Card, Text } from "@chakra-ui/react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { useNavigate } from "react-router-dom"

export const BlockSummary = ({ block }: { block: ExpandedBlockDetail }) => {
  const navigate = useNavigate()
  const clauseCount = block.transactions?.reduce((count, tx) => count + (tx.clauses?.length ?? 0), 0) ?? 0

  const handleClick = () => {
    navigate(`/block/${block.id}`)
  }

  return (
    <Card.Root onClick={handleClick} style={{ cursor: "pointer" }}>
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
