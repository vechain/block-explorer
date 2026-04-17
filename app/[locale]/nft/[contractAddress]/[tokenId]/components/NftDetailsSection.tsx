'use client'

import { Badge, Box, Flex, Link, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuExternalLink } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { CopyableString } from '@/components/ui/CopyableString'
import { CopyableAddressLink, CopyableLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import type { AddressString } from '@/lib/schemas'
import type { NftMetadata } from '@/services/nft-metadata'
import { type Erc721, useErc721CollectionStats } from '@/services/thor/tokens/erc721'
import { useFormatNumber } from '@/hooks/useFormatting'
import { truncateString } from '@/lib/utils/truncateString'
import { useMintEvent } from '@/services/veworld-indexer/nft-transfers'
import { useStargateNftInfo } from '@/services/thor/tokens/stargate'
import { isStargateNftContract, getStargateLink } from '@/lib/constants/stargate-nft'
import { useSettingsStore } from '@/lib/stores/settings'
import { formatEther } from 'viem'
import { useIsMobile } from '@/hooks/useIsMobile'

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
    px={{ base: 4, md: 6 }}
    borderBottomWidth="1px"
    borderColor="border-primary"
    _last={{ borderBottomWidth: 0 }}
    gap={{ base: 2, md: 4 }}
  >
    <Text textStyle="bodyM" color="text-primary" minWidth={{ base: '80px', md: '120px' }} flexShrink={0}>
      {label}
    </Text>
    <Box overflow="hidden" textAlign="right" minWidth={0}>
      {children}
    </Box>
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
  const { activeNetwork } = useSettingsStore()
  const isMobile = useIsMobile()
  const truncateLength = isMobile ? 20 : 40
  const truncateEnd = isMobile ? 6 : 8
  const nftName = metadata?.name || `#${tokenId.toString()}`
  const tokenIdValue = tokenId.toString()

  const { data: collectionStats } = useErc721CollectionStats({ contractAddress })
  const { mintEvent } = useMintEvent({ contractAddress, tokenId })

  // Fetch Stargate NFT info if this is a Stargate NFT
  const isStargate = isStargateNftContract(contractAddress, activeNetwork)
  const { data: stargateNftInfo, isLoading: isLoadingStargateInfo } = useStargateNftInfo({
    contractAddress,
    tokenId,
  })

  // Format VET amount for display
  const formatVetAmount = (amount: bigint): string => {
    const formatted = formatEther(amount)
    return formatNumber(Number(formatted))
  }

  return (
    <Card variant="secondary" gap={6}>
      {/* NFT Details */}
      <SectionCard title={t('NFT Details')}>
        <DetailRow label={t('Name')}>
          <CopyableString
            value={nftName}
            containerProps={{ justifyContent: 'flex-end' }}
            textStyle="bodyM"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {truncateString(nftName, truncateLength, truncateEnd)}
          </CopyableString>
        </DetailRow>
        <DetailRow label={t('Token ID')}>
          <CopyableString
            value={tokenIdValue}
            title={`#${tokenIdValue}`}
            containerProps={{ justifyContent: 'flex-end' }}
            textStyle="bodyM"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            #{truncateString(tokenIdValue, truncateLength, truncateEnd)}
          </CopyableString>
        </DetailRow>
        <DetailRow label={t('Contract Address')}>
          <CopyableAddressLink address={contractAddress} truncate />
        </DetailRow>
        <DetailRow label={t('Token Standard')}>
          <Badge bg="bg-alt-primary" px={2} py={1} borderRadius="md" color="text-primary">
            {'ERC 721'}
          </Badge>
        </DetailRow>
        {/* Stargate NFT specific fields */}
        {isStargate && (
          <DetailRow label={t('NFT Value')}>
            {isLoadingStargateInfo ? (
              <Skeleton height="20px" width="80px" />
            ) : stargateNftInfo?.vetAmountStaked ? (
              <Link
                href={getStargateLink(activeNetwork.name, `/nft/${tokenId.toString()}`)}
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
                gap={1}
                _hover={{ textDecoration: 'none', opacity: 0.8 }}
                _focus={{ outline: 'none', boxShadow: 'none' }}
                _focusVisible={{ outline: 'none', boxShadow: 'none' }}
              >
                <Text textStyle="bodyM" color="text-primary">
                  {formatVetAmount(stargateNftInfo.vetAmountStaked)}
                </Text>
                <Text textStyle="bodyM" color="text-primary">
                  VET
                </Text>
                <LuExternalLink size={12} color="var(--chakra-colors-text-secondary)" />
              </Link>
            ) : (
              <Text textStyle="bodyM" color="text-secondary">
                -
              </Text>
            )}
          </DetailRow>
        )}
      </SectionCard>

      {/* NFT Mint */}
      {mintEvent && (
        <SectionCard title={t('NFT Mint')}>
          <DetailRow label={t('Block')}>
            <CopyableLink href={`/block/${mintEvent.blockId}`} value={String(mintEvent.blockNumber)}>
              #{formatNumber(mintEvent.blockNumber)}
            </CopyableLink>
          </DetailRow>
          <DetailRow label={t('Transaction ID')}>
            <CopyableTransactionIdLink txId={mintEvent.txId} />
          </DetailRow>
          {mintEvent.to && (
            <DetailRow label={t('Minted by')}>
              <CopyableAddressLink address={mintEvent.to} truncate />
            </DetailRow>
          )}
        </SectionCard>
      )}

      {/* Collection Details */}
      <SectionCard title={t('Collection Details')}>
        <DetailRow label={t('Collection')}>
          <CopyableString value={collection.name} containerProps={{ justifyContent: 'flex-end' }} textStyle="bodyM">
            {collection.name}
          </CopyableString>
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
