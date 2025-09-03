import { Group, Skeleton, Text } from '@chakra-ui/react'
import type { ExpandedBlockDetail } from '@vechain/sdk-network'
import { BlockLink } from '@/components/ui/Links'
import { formatDateFromTimestamp } from '@/lib/utils/date'

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
      <BlockLink blockId={block.id}>#{block.number.toLocaleString()}</BlockLink>
      <Text>{formatDateFromTimestamp(block.timestamp)}</Text>
      <Text>{block.transactions.length ?? 0} Transactions</Text>
      <Text>{clauseCount} Clauses</Text>
    </Group>
  )
}

export const BlockRowSkeleton = () => {
  return <Skeleton height="58px" width="100%" bg="bg.emphasized" />
}
