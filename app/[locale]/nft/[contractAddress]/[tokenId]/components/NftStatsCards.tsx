'use client'

import { Grid, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { CopyableAddressLink } from '@/components/ui/Links'
import type { AddressString } from '@/lib/schemas'
import { useErc721Owner } from '@/services/thor/tokens/erc721'
import { useMintEvent } from '@/services/veworld-indexer/nft-transfers'
import { useFormatDate } from '@/hooks/useFormatting'

interface NftStatsCardsProps {
  contractAddress: AddressString
  tokenId: bigint
}

export const NftStatsCards = ({ contractAddress, tokenId }: NftStatsCardsProps) => {
  const { t } = useTranslation()
  const { data: owner, isPending: isOwnerPending } = useErc721Owner({ contractAddress, tokenId })
  const { mintEvent, isPending: isMintEventLoading } = useMintEvent({ contractAddress, tokenId })
  const formatDate = useFormatDate()
  const mintDate = mintEvent ? formatDate(mintEvent.blockTimestamp * 1000) : null

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
      <DataCard
        variant="secondary"
        icon={<Image src="/icons/group.svg" alt="Owned by" width={12} height={12} />}
        title={t('Owned by')}
      >
        {isOwnerPending ? (
          <Skeleton height="24px" width="100%" />
        ) : owner ? (
          <CopyableAddressLink address={owner} truncate />
        ) : (
          <Text color="text-secondary">-</Text>
        )}
      </DataCard>

      <DataCard
        variant="secondary"
        icon={<Image src="/icons/calendar.svg" alt="Minted on" width={12} height={12} />}
        title={t('Minted on')}
      >
        {isMintEventLoading ? (
          <Skeleton height="24px" width="100%" />
        ) : mintDate ? (
          <Text textStyle="bodyM" color="text-primary">
            {mintDate}
          </Text>
        ) : (
          <Text color="text-secondary">-</Text>
        )}
      </DataCard>
    </Grid>
  )
}
