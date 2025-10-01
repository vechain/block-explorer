import { Group, Skeleton, Text } from '@chakra-ui/react'
import { motion } from 'motion/react'
import { BlockLink } from '@/components/ui/Links'
import type { ExpandedBlockDetail } from '@/lib/schemas'
import { formatDateFromTimestamp } from '@/lib/utils/date'

export const BlockRow = ({ block }: { block: ExpandedBlockDetail }) => {
  const clauseCount = block.transactions.reduce((count, tx) => count + tx.clauses.length, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ width: '100%' }}>
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
    </motion.div>
  )
}

export const BlockRowSkeleton = () => {
  return <Skeleton height="58px" width="100%" bg="bg.emphasized" />
}
