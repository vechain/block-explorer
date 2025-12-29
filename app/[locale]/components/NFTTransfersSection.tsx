'use client'

import { Box, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { useRecentNFTTransfers } from '@/services/veworld-indexer/hooks'
import { NFTTransfersTable } from './NFTTransfersTable'

const TRANSFERS_TO_DISPLAY = 5

export const NFTTransfersSection = () => {
  const { t } = useTranslation()
  const { data: transfers, isPending } = useRecentNFTTransfers({ count: TRANSFERS_TO_DISPLAY })

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('NFT Transfers')}
      </Heading>
      <Box minHeight="320px">{isPending ? <TableSkeleton /> : <NFTTransfersTable transfers={transfers ?? []} />}</Box>
    </Card>
  )
}
