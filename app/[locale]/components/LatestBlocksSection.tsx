'use client'

import { Heading } from '@chakra-ui/react'
import { Surface } from '@/components/ui/Surface'
import { TableSkeleton } from '@/components/ui/Table'
import { useLatestBlocks } from '@/services/thor/hooks'
import { LatestBlocksTable } from './LatestBlocksTable'

const BLOCKS_TO_DISPLAY = 5

export const LatestBlocksSection = () => {
  const { data: latestBlocks, isPending } = useLatestBlocks({ count: BLOCKS_TO_DISPLAY })

  return (
    <Surface>
      <Heading as="h3" textStyle="displayXs">
        Activity
      </Heading>
      {isPending ? <TableSkeleton /> : <LatestBlocksTable blocks={latestBlocks} />}
    </Surface>
  )
}
