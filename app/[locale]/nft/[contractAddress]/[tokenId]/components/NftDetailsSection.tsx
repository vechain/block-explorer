'use client'

import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { AddressLink, BaseLink } from '@/components/ui/Links'
import type { AddressString } from '@/lib/schemas'
import type { NftMetadata } from '@/services/nft-metadata'
import { type Erc721, useErc721CollectionStats } from '@/services/thor/tokens/erc721'
import { useNftTransfers } from '@/services/veworld-indexer/nft-transfers'
import { useFormatNumber } from '@/hooks/useFormatting'
import { ZERO_ADDRESS } from '@vechain/sdk-core'
import { truncateHex } from '@/lib/utils/truncateHex'

interface NftDetailsSectionProps {
  collection: Erc721
  contractAddress: AddressString
  tokenId: bigint
  metadata: NftMetadata | null | undefined
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Flex
    justifyContent="space-between"
    alignItems="center"
    py={4}
    px={6}
    borderBottomWidth="1px"
    borderColor="border-primary"
    _last={{ borderBottomWidth: 0 }}
  >
    <Text textStyle="bodyM" color="text-primary" minWidth="120px">
      {label}
    </Text>
    <Box>{children}</Box>
  </Flex>
)

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Stack gap={5}>
    <Text textStyle="bodyL" color="text-primary">
      {title}
    </Text>
    <Box borderWidth="1px" borderColor="border-primary" borderRadius="lg" overflow="hidden">
      {children}
    </Box>
  </Stack>
)

export const NftDetailsSection = ({ collection, contractAddress, tokenId, metadata }: NftDetailsSectionProps) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const { data: collectionStats } = useErc721CollectionStats({ contractAddress })
  const { data: transfersData } = useNftTransfers({
    contractAddress,
    tokenId,
    size: 100,
  })

  const mintTransfer = transfersData?.data.find(transfer => transfer.from.toLowerCase() === ZERO_ADDRESS.toLowerCase())

  return (
    <Card variant="secondary" gap={6}>
      {/* NFT Details */}
      <SectionCard title={t('NFT Details')}>
        <DetailRow label={t('Name')}>
          <Text textStyle="bodyM" color="text-primary">
            {metadata?.name || `#${tokenId.toString()}`}
          </Text>
        </DetailRow>
        <DetailRow label={t('Token ID')}>
          <Text textStyle="bodyM" color="text-primary">
            #{tokenId.toString()}
          </Text>
        </DetailRow>
        <DetailRow label={t('Contract Address')}>
          <AddressLink address={contractAddress} truncate />
        </DetailRow>
        <DetailRow label={t('Token Standard')}>
          <Badge bg="bg-alt-primary" px={2} py={1} borderRadius="md" color="text-primary">
            {'ERC 721'}
          </Badge>
        </DetailRow>
      </SectionCard>

      {/* NFT Mint */}
      {mintTransfer && (
        <SectionCard title={t('NFT Mint')}>
          <DetailRow label={t('Block')}>
            <BaseLink href={`/block/${mintTransfer.blockId}`}>#{formatNumber(mintTransfer.blockNumber)}</BaseLink>
          </DetailRow>
          <DetailRow label={t('Transaction ID')}>
            <BaseLink href={`/transaction/${mintTransfer.txId}`}>{truncateHex(mintTransfer.txId)}</BaseLink>
          </DetailRow>
          <DetailRow label={t('Minted by')}>
            <AddressLink address={mintTransfer.to} truncate />
          </DetailRow>
        </SectionCard>
      )}

      {/* Collection Details */}
      <SectionCard title={t('Collection Details')}>
        <DetailRow label={t('Collection')}>
          <Text textStyle="bodyM" color="text-primary">
            {collection.name}
          </Text>
        </DetailRow>
        <DetailRow label={t('Symbol')}>
          <Text textStyle="bodyM" color="text-primary">
            {collection.symbol}
          </Text>
        </DetailRow>
        <DetailRow label={t('Total NFTs')}>
          <Text textStyle="bodyM" color="text-primary">
            {collectionStats?.totalSupply != null ? formatNumber(Number(collectionStats.totalSupply)) : '-'}
          </Text>
        </DetailRow>
      </SectionCard>

      {/* Attributes */}
      {metadata?.attributes && metadata.attributes.length > 0 && (
        <SectionCard title={t('Attributes')}>
          {metadata.attributes.map((attr, index) => (
            <DetailRow key={index} label={attr.traitType}>
              <Text textStyle="bodyM" color="text-primary">
                {String(attr.value)}
              </Text>
            </DetailRow>
          ))}
        </SectionCard>
      )}
    </Card>
  )
}
