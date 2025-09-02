'use client'

import { Heading, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLatestBlocks } from '@/services/thor/hooks'
import { BlockRow, BlockRowSkeleton } from './BlockRow'

const BLOCKS_TO_DISPLAY = 5

export const LatestBlocksSection = () => {
  const { data: latestBlocks, isPending } = useLatestBlocks({ count: BLOCKS_TO_DISPLAY })

  const { t } = useTranslation()

  return (
    <Stack gap={10}>
      <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
        {t('latest_blocks')}
      </Heading>

      <Stack gap={2} alignItems="flex-start" width="100%">
        {isPending ? <LatestBlocksSkeleton /> : latestBlocks.map(block => <BlockRow key={block.id} block={block} />)}
      </Stack>
    </Stack>
  )
}

const LatestBlocksSkeleton = () => {
  return Array.from({ length: BLOCKS_TO_DISPLAY }).map((_, i) => <BlockRowSkeleton key={`${i}-${Date.now()}`} />)
}
