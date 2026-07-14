'use client'

import { Flex, Grid, Heading, Skeleton, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { NotFound } from '@/components/error/NotFound'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useAgentRegistration } from '@/services/agent-nft/hooks'
import { parseNftMetadataUri, useNftMetadata } from '@/services/nft-metadata'
import { useErc721Contract, useErc721Token } from '@/services/thor/tokens/erc721'
import { AgentNftView } from './agent/AgentNftView'
import { NftDetailHeader } from './NftDetailHeader'
import { NftStatsCards } from './NftStatsCards'
import { NftDetailsSection } from './NftDetailsSection'
import { NftTransfersSection } from './NftTransfersSection'

export const NftDetailPageContent = ({
  contractAddress,
  tokenId,
}: {
  contractAddress: AddressString
  tokenId: bigint
}) => {
  const { t } = useTranslation()

  const { data: collection, isPending: isCollectionPending } = useErc721Contract({ contractAddress })
  const { data: token, isPending: isTokenPending } = useErc721Token({
    contract: collection?.contract,
    tokenId,
  })
  const { data: metadata, isPending: isMetadataPending } = useNftMetadata(token?.tokenUri ?? '')
  const { data: agentRegistration, isPending: isAgentRegistrationPending } = useAgentRegistration({
    tokenUri: token?.tokenUri,
  })

  const isPending = isCollectionPending || isTokenPending || (!!token?.tokenUri && isAgentRegistrationPending)

  if (isPending) {
    return (
      <Card variant="primary">
        <Skeleton height="400px" borderRadius="md" />
      </Card>
    )
  }

  if (!collection) {
    return <NotFound title={t('NFT not found')} description={t('The NFT you are looking for does not exist')} />
  }

  const nftImage = metadata?.image ? parseNftMetadataUri(metadata.image) : '/no-image.png'
  const nftName = metadata?.name || `#${tokenId.toString()}`

  // Agent NFTs (ERC-8004 registration file at tokenURI) get a dedicated tabbed view.
  if (agentRegistration) {
    const agentImage = agentRegistration.image ? parseNftMetadataUri(agentRegistration.image) : nftImage
    return (
      <AgentNftView
        contractAddress={contractAddress}
        tokenId={tokenId}
        collection={collection}
        registration={agentRegistration}
        nftImage={agentImage}
        tokenUri={token?.tokenUri}
      />
    )
  }

  return (
    <Card variant="primary">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap">
          {t('NFT')}
        </Heading>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '322px 1fr' }} gap={5} alignItems="start">
        {/* Left Column: NFT Image & Collection Info */}
        <NftDetailHeader
          nftImage={nftImage}
          nftName={nftName}
          tokenId={tokenId}
          collection={collection}
          contractAddress={contractAddress}
          description={metadata?.description}
          isMetadataPending={isMetadataPending}
        />

        {/* Right Column: Stats & Details */}
        <Stack gap={4} flex={1}>
          <NftStatsCards contractAddress={contractAddress} tokenId={tokenId} />

          <NftDetailsSection
            collection={collection}
            contractAddress={contractAddress}
            tokenId={tokenId}
            metadata={metadata}
          />
        </Stack>
      </Grid>

      <NftTransfersSection contractAddress={contractAddress} tokenId={tokenId} />
    </Card>
  )
}
