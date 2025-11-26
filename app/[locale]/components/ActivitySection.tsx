'use client'

import { Heading } from '@chakra-ui/react'
import { Surface } from '@/components/ui/Surface'
import { TableSkeleton } from '@/components/ui/Table'
import { useLatestBlocksCompressed } from '@/services/thor/hooks'
import { BlocksTable } from './BlocksTable'

const BLOCKS_TO_DISPLAY = 5

export const ActivitySection = () => {
  const { data: latestBlocks, isPending } = useLatestBlocksCompressed({ count: BLOCKS_TO_DISPLAY })

  return (
    <Surface>
      <Heading as="h3" textStyle="displayXs">
        Activity
      </Heading>
      {isPending ? <TableSkeleton /> : <BlocksTable blocks={latestBlocks} />}
    </Surface>
  )
}
