import { Text, Link as ChakraLink, Group, Skeleton } from "@chakra-ui/react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { Link as RouterLink } from "react-router-dom"

export const BlockRow = ({ block }: { block: ExpandedBlockDetail }) => {
  const clauseCount = block.transactions.reduce((count, tx) => count + tx.clauses.length, 0)

  return (
    <Group
      gap={2}
      p={4}
      border="1px solid"
      borderColor="gray.200"
      rounded="md"
      width="100%"
      justifyContent="space-between">
      <ChakraLink asChild colorPalette="blue">
        <RouterLink to={`/block/${block.id}`}>#{block.number.toLocaleString()}</RouterLink>
      </ChakraLink>
      <Text>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</Text>
      <Text>{block.transactions?.length ?? 0} Transactions</Text>
      <Text>{clauseCount} Clauses</Text>
    </Group>
  )
}

export const BlockRowSkeleton = () => {
  return <Skeleton height="58px" width="100%" bg="bg.emphasized" />
}
