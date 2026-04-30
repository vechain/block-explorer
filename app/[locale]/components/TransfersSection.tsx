'use client'

import { Box, Flex, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { ViewAllLink } from '@/components/ui/Links'
import { NoTokenTransfers } from '@/components/NoResults'
import { TransfersTable } from '@/components/TransfersTable'
import { useLatestTransfersLive } from '@/services/veworld-indexer/latest-transfers'

const TRANSFERS_TO_DISPLAY = 5

export const TransfersSection = () => {
  const { t } = useTranslation()
  const { data, isPending } = useLatestTransfersLive({ size: TRANSFERS_TO_DISPLAY })

  const transfers = data?.data ?? []
  const hasNoTransfers = !isPending && transfers.length === 0

  return (
    <Card>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="displayXs">
          {t('Token Transfers')}
        </Heading>
        <ViewAllLink href="/transfers">{t('View all')}</ViewAllLink>
      </Flex>
      <Box minHeight="320px">
        {isPending ? (
          <TableSkeleton />
        ) : hasNoTransfers ? (
          <NoTokenTransfers />
        ) : (
          <TransfersTable transfers={transfers} />
        )}
      </Box>
    </Card>
  )
}
