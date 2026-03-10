'use client'

import { Box, Flex, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { ViewAllLink } from '@/components/ui/Links'
import { NoTokenTransfers } from '@/components/NoResults'
import { useRecentTokenTransfers } from '@/services/veworld-indexer/recent-activity'
import { TokenTransfersTable } from './TokenTransfersTable'

const TRANSFERS_TO_DISPLAY = 5

export const TokenTransfersSection = () => {
  const { t } = useTranslation()
  const { data: transfers, isPending } = useRecentTokenTransfers({ count: TRANSFERS_TO_DISPLAY })

  const hasNoTransfers = !isPending && (!transfers || transfers.length === 0)

  return (
    <Card>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="displayXs">
          {t('Token Transfers')}
        </Heading>
        <ViewAllLink href="/transfers/token">{t('View all')}</ViewAllLink>
      </Flex>
      <Box minHeight="320px">
        {isPending ? (
          <TableSkeleton />
        ) : hasNoTransfers ? (
          <NoTokenTransfers />
        ) : (
          <TokenTransfersTable transfers={transfers ?? []} />
        )}
      </Box>
    </Card>
  )
}
