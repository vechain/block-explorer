import { Card, Text } from "@chakra-ui/react"
import { useBestBlock } from "@/hooks/thor/useBestBlock"

export function LastBlock() {
  const { data: bestBlock, isLoading } = useBestBlock()

  if (isLoading) return <div>Loading...</div>
  if (!bestBlock) return <div>No block found</div>

  return (
    <Card.Root>
      <Card.Header>Last Block</Card.Header>
      <Card.Body>
        <Text>{bestBlock.number.toLocaleString()}</Text>
      </Card.Body>
    </Card.Root>
  )
}
