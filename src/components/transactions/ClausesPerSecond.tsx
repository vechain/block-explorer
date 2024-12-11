import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks.ts"
import { useMemo } from "react"
import { Card, Text } from "@chakra-ui/react"

export const ClausesPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { blocks } = useLatestBlocks({ count: numBlocks + 1 })

  const clausesPerSec = useMemo(() => {
    if (blocks.length < numBlocks + 1) {
      return 0
    }
    // Get the difference in time between the first and last block
    const timeDifference = blocks[0].timestamp - blocks[blocks.length - 1].timestamp

    // Get the total number of clauses in all but the last block
    const totalClauses = blocks
      .slice(0, -1)
      .reduce((total, block) => total + block.transactions.reduce((cl3, tx) => cl3 + tx.clauses.length, 0), 0)

    // Calculate the clauses per second
    return totalClauses / timeDifference
  }, [blocks, numBlocks])

  return (
    <Card.Root>
      <Card.Header>Clauses per second</Card.Header>
      <Card.Body>
        <Text>{clausesPerSec.toLocaleString()}</Text>
        <Card.Description>Last {numBlocks} blocks</Card.Description>
      </Card.Body>
    </Card.Root>
  )
}
