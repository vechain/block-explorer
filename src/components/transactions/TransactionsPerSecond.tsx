import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks.ts"
import { useMemo } from "react"
import { Card, Text } from "@chakra-ui/react"

export const TransactionsPerSecond = () => {
  const { blocks } = useLatestBlocks({ count: 2 })

  const transactionsPerSec = useMemo(() => {
    if (blocks.length < 1) {
      return 0
    }
    // Get the difference in time between the first and last block
    const timeDifference = blocks[0].timestamp - blocks[blocks.length - 1].timestamp

    // Get the total number of transactions in the blocks
    const totalTransactions = blocks[0].transactions.length

    // Calculate the transactions per second
    return totalTransactions / timeDifference
  }, [blocks])

  return (
    <Card.Root>
      <Card.Header>Transactions per second</Card.Header>
      <Card.Body>
        <Text>{transactionsPerSec.toLocaleString()}</Text>
      </Card.Body>
    </Card.Root>
  )
}
