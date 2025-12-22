'use client'

import { Box, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { useRecentBlocksExpanded } from '@/services/veworld-indexer/hooks'
import { BlocksTable } from './BlocksTable'

const BLOCKS_TO_DISPLAY = 5

export const ActivitySection = () => {
  const { t } = useTranslation()
  const { data: latestBlocks, isPending } = useRecentBlocksExpanded({ count: BLOCKS_TO_DISPLAY })

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Activity')}
      </Heading>
      <Box minHeight="320px">{isPending ? <TableSkeleton /> : <BlocksTable blocks={latestBlocks ?? []} />}</Box>
    </Card>
  )
}
