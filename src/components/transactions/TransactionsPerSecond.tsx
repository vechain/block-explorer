import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks.ts"
import { useMemo } from "react"
import { Card, Text } from "@chakra-ui/react"

export const TransactionsPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { blocks } = useLatestBlocks({ count: numBlocks + 1 })

  const transactionsPerSec = useMemo(() => {
    if (blocks.length < numBlocks + 1) {
      return 0
    }
    // Get the difference in time between the first and last block
    const timeDifference = blocks[0].timestamp - blocks[blocks.length - 1].timestamp

    // Get the total number of transactions in all but the last block
    const totalTransactions = blocks.slice(0, -1).reduce((total, block) => total + block.transactions.length, 0)

    // Calculate the transactions per second
    return totalTransactions / timeDifference
  }, [blocks, numBlocks])

  return (
    <Card.Root>
      <Card.Header>Transactions</Card.Header>
      <Card.Body>
        <Text>{transactionsPerSec.toLocaleString()} per second</Text>
        <Card.Description>Last {numBlocks} blocks</Card.Description>
      </Card.Body>
    </Card.Root>
  )
}
