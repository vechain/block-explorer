import { Card, Text } from "@chakra-ui/react"
import { BlockDetail } from "@vechain/sdk-network"

export const Block = ({ block }: { block: BlockDetail }) => {
  return (
    <Card.Root>
      <Card.Header>Block</Card.Header>
      <Card.Body>
        <Text>Number: {block.number}</Text>
        <Text>ID: {block.id}</Text>
      </Card.Body>
    </Card.Root>
  )
}
