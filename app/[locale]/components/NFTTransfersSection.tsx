'use client'

import { Box, Center, Flex, Heading, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { ViewAllLink } from '@/components/ui/Links'
import { useRecentNFTTransfers } from '@/services/veworld-indexer/hooks'
import { NFTTransfersTable } from './NFTTransfersTable'

const TRANSFERS_TO_DISPLAY = 5

export const NFTTransfersSection = () => {
  const { t } = useTranslation()
  const { data: transfers, isPending } = useRecentNFTTransfers({ count: TRANSFERS_TO_DISPLAY })

  const hasNoTransfers = !isPending && (!transfers || transfers.length === 0)

  return (
    <Card>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="displayXs">
          {t('NFT Transfers')}
        </Heading>
        <ViewAllLink href="/transfers/nft">{t('View all')}</ViewAllLink>
      </Flex>
      <Box minHeight="320px">
        {isPending ? (
          <TableSkeleton />
        ) : hasNoTransfers ? (
          <Center h="320px">
            <Text color="text-secondary">{t('No transfers')}</Text>
          </Center>
        ) : (
          <NFTTransfersTable transfers={transfers ?? []} />
        )}
      </Box>
    </Card>
  )
}
