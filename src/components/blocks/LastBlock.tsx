import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"
import { Card, Text } from "@chakra-ui/react"

const LastBlock = () => {
  const { bestBlock } = useBestBlock()

  return (
    <Card.Root>
      <Card.Header>Last Block</Card.Header>
      <Card.Body>
        <Text>{bestBlock ? bestBlock.number.toLocaleString() : "Loading..."}</Text>
      </Card.Body>
    </Card.Root>
  )
}

export default LastBlock
