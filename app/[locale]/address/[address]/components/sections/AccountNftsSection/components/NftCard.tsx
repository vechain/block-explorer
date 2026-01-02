import { Badge, Box, Flex, Image, Text } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { parseNftMetadataUri, useNftMetadata } from '@/services/nft-metadata'
import type { Erc721Token } from '@/services/thor/tokens/erc721'
import { NftCardSkeleton } from './NftCardSkeleton'

interface NftCardProps {
  token: Erc721Token
  collectionName: string
}

export const NftCard = ({ token, collectionName }: NftCardProps) => {
  const { data: metadata, isPending } = useNftMetadata(token.tokenUri)

  const displayName = metadata?.name || `#${token.tokenId}`
  const tokenIdPrefix = `#${token.tokenId.toString().padStart(2, '0')}`

  if (isPending) {
    return <NftCardSkeleton />
  }

  return (
    <Card variant="tertiary" overflow="hidden" gap={3}>
      <Box position="relative" paddingBottom="100%">
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
      </Box>
      <Flex alignItems="center" justifyContent="center">
        <Text fontWeight="semibold" textStyle="bodyS" truncate>
          {tokenIdPrefix} {metadata?.name?.toUpperCase() || ''}
        </Text>
      </Flex>
    </Card>
  )
}
