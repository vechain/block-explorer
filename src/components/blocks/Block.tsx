import { Card, Text } from "@chakra-ui/react"
import { CompressedBlockDetail } from "@vechain/sdk-network"

export const Block = ({ block }: { block: CompressedBlockDetail }) => {
  return (
    <Card.Root>
      <Card.Header>{block.id}</Card.Header>
      <Card.Body>
        <Text>No: {block.number.toLocaleString()}</Text>
        <Text>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</Text>
        <Text>Transactions: {block.transactions?.length ?? 0}</Text>
      </Card.Body>
    </Card.Root>
  )
}
