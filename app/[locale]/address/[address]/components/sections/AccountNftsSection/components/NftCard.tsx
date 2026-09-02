import { Badge, Box, Flex, Image, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useNetworkAwareHref } from '@/hooks/useNetworkAwareHref'
import type { AddressString } from '@/lib/schemas'
import { parseNftMetadataUri, useNftMetadata } from '@/services/nft-metadata'
import type { Erc721Token } from '@/services/thor/tokens/erc721'
import { NftCardSkeleton } from './NftCardSkeleton'
import { motion } from 'motion/react'

const MotionLink = motion(Link)

interface NftCardProps {
  token: Erc721Token
  collectionName: string
  contractAddress: AddressString
}

export const NftCard = ({ token, collectionName, contractAddress }: NftCardProps) => {
  const { data: metadata, isPending } = useNftMetadata(token.tokenUri)

  const displayName = metadata?.name || `#${token.tokenId}`
  const tokenIdPrefix = `#${token.tokenId.toString().padStart(2, '0')}`
  const href = useNetworkAwareHref(`/nft/${contractAddress}/${token.tokenId.toString()}`)

  if (isPending) {
    return <NftCardSkeleton />
  }

  return (
    <MotionLink
      href={href}
      style={{ width: '100%', minWidth: '0' }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
    >
      <Card variant="tertiary" overflow="hidden" gap={3} cursor="pointer">
        <Flex position="relative" paddingBottom="100%">
          {collectionName && (
            <Badge
              position="absolute"
              top={2}
              right={2}
              zIndex={1}
              bg="bg-secondary"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="md"
              maxW="80%"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              overflow="hidden"
              display="inline-block"
            >
              {collectionName}
            </Badge>
          )}
          <Box position="absolute" display="flex" alignItems="center" justifyContent="center">
            {metadata?.image ? (
              <Image
                src={parseNftMetadataUri(metadata.image)}
                alt={displayName}
                objectFit="cover"
                borderRadius="12px"
                width="100%"
                aspectRatio="1/1"
              />
            ) : (
              <Image
                src="/no-image.png"
                alt={displayName}
                objectFit="cover"
                borderRadius="12px"
                width="100%"
                aspectRatio="1/1"
              />
            )}
          </Box>
        </Flex>
        <Flex alignItems="center" justifyContent="center">
          <Text fontWeight="semibold" textStyle="bodyS" truncate>
            {tokenIdPrefix} {metadata?.name?.toUpperCase() || ''}
          </Text>
        </Flex>
      </Card>
    </MotionLink>
  )
}
