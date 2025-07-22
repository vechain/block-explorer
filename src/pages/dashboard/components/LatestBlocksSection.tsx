import { Heading, Stack } from "@chakra-ui/react"
import { useLatestBlocks } from "@/services/thor/block/hooks"
import { BlockRow, BlockRowSkeleton } from "./BlockRow"

const BLOCKS_TO_DISPLAY = 5

export const LatestBlocksSection = () => {
  const { data: latestBlocks, isPending } = useLatestBlocks({ count: BLOCKS_TO_DISPLAY })

  return (
    <Stack gap={10}>
      <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
        Latest Blocks
      </Heading>

      <Stack gap={2} alignItems="flex-start" width="100%">
        {isPending ? <LatestBlocksSkeleton /> : latestBlocks.map(block => <BlockRow key={block.id} block={block} />)}
      </Stack>
    </Stack>
  )
}

const LatestBlocksSkeleton = () => {
  return Array.from({ length: BLOCKS_TO_DISPLAY }).map((_, i) => <BlockRowSkeleton key={i} />)
}
