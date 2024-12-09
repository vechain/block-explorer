import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks.ts"
import { useMemo } from "react"
import { Card, Text } from "@chakra-ui/react"

export const ClausesPerSecond = () => {
  const { blocks } = useLatestBlocks({ count: 2 })

  const clausesPerSec = useMemo(() => {
    if (blocks.length < 1) {
      return 0
    }
    // Get the difference in time between the first and last block
    const timeDifference = blocks[0].timestamp - blocks[blocks.length - 1].timestamp

    // Get the total number of clauses in the blocks
    const totalClauses = blocks[0].transactions.reduce((cl3, tx) => cl3 + tx.clauses.length, 0)

    // Calculate the clauses per second
    return totalClauses / timeDifference
  }, [blocks])

  return (
    <Card.Root>
      <Card.Header>Clauses per second</Card.Header>
      <Card.Body>
        <Text>{clausesPerSec.toLocaleString()}</Text>
      </Card.Body>
    </Card.Root>
  )
}
