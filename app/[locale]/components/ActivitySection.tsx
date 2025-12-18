'use client'

import { Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { useLatestBlocksExpanded } from '@/services/thor/hooks'
import { BlocksTable } from './BlocksTable'

const BLOCKS_TO_DISPLAY = 5

export const ActivitySection = () => {
  const { t } = useTranslation()
  const { data: latestBlocks, isPending } = useLatestBlocksExpanded({ count: BLOCKS_TO_DISPLAY })

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Activity')}
      </Heading>
      {isPending && !latestBlocks?.length ? <TableSkeleton /> : <BlocksTable blocks={latestBlocks} />}
    </Card>
  )
}
