'use client'

import { Box, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { useRecentTokenTransfers } from '@/services/veworld-indexer/hooks'
import { TokenTransfersTable } from './TokenTransfersTable'

const TRANSFERS_TO_DISPLAY = 5

export const TokenTransfersSection = () => {
  const { t } = useTranslation()
  const { data: transfers, isPending } = useRecentTokenTransfers({ count: TRANSFERS_TO_DISPLAY })

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Token Transfers')}
      </Heading>
      <Box minHeight="320px">{isPending ? <TableSkeleton /> : <TokenTransfersTable transfers={transfers ?? []} />}</Box>
    </Card>
  )
}
