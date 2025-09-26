'use client'

import { Heading, Stack } from '@chakra-ui/react'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useLatestBlocks } from '@/services/thor/hooks'
import { BlockRow, BlockRowSkeleton } from './BlockRow'

const BLOCKS_TO_DISPLAY = 5

export const LatestBlocksSection = () => {
  const { t } = useTranslation()
  const { data: latestBlocks, isLoading } = useLatestBlocks({ count: BLOCKS_TO_DISPLAY })

  return (
    <Stack gap={10}>
      <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
        {t('latest_blocks')}
      </Heading>

      <Stack gap={2} alignItems="flex-start" width="100%">
        {isLoading ? (
          <LatestBlocksSkeleton />
        ) : (
          <AnimatePresence>
            {latestBlocks.map(block => (
              <BlockRow key={block.id} block={block} />
            ))}
          </AnimatePresence>
        )}
      </Stack>
    </Stack>
  )
}

const LatestBlocksSkeleton = () => {
  return Array.from({ length: BLOCKS_TO_DISPLAY }).map((_, i) => <BlockRowSkeleton key={`${i}-${Date.now()}`} />)
}
