'use client'

import { Box, Flex, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { BaseLink } from '@/components/ui/Links'
import { useRecentTokenTransfers } from '@/services/veworld-indexer/hooks'
import { TokenTransfersTable } from './TokenTransfersTable'

const TRANSFERS_TO_DISPLAY = 5

export const TokenTransfersSection = () => {
  const { t } = useTranslation()
  const { data: transfers, isPending } = useRecentTokenTransfers({ count: TRANSFERS_TO_DISPLAY })

  return (
    <Card>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="displayXs">
          {t('Token Transfers')}
        </Heading>
        <BaseLink href="/transfers/token" textStyle="bodyMSemibold" color="text-link">
          {t('View all')}
        </BaseLink>
      </Flex>
      <Box minHeight="320px">{isPending ? <TableSkeleton /> : <TokenTransfersTable transfers={transfers ?? []} />}</Box>
    </Card>
  )
}
