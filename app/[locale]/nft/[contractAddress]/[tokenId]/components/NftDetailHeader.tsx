'use client'

import { Badge, Box, Flex, Image, Link as ChakraLink, Skeleton, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useNetworkAwareHref } from '@/hooks/useNetworkAwareHref'
import type { AddressString } from '@/lib/schemas'
import type { Erc721 } from '@/services/thor/tokens/erc721'
import { truncateString } from '@/lib/utils/truncateString'

interface NftDetailHeaderProps {
  nftImage: string
  nftName: string
  tokenId: bigint
  collection: Erc721
  contractAddress: AddressString
  description?: string
  isMetadataPending?: boolean
}

export const NftDetailHeader = ({
  nftImage,
  nftName,
  tokenId,
  collection,
  contractAddress,
  description,
  isMetadataPending,
}: NftDetailHeaderProps) => {
  const collectionHref = useNetworkAwareHref(`/address/${contractAddress}`)
  return (
    <Stack gap={6}>
      <Card variant="tertiary" p={4} position="relative">
        <Box position="relative" borderRadius="xl" overflow="hidden">
          <Image src={nftImage} alt={nftName} objectFit="cover" aspectRatio="1/1" width="100%" borderRadius="xl" />
          <Badge
            position="absolute"
            top={4}
            right={4}
            bg="rgba(255, 255, 255, 0.1)"
            backdropFilter="blur(20px)"
            borderRadius="full"
            px={3}
            py={1}
            color="text-primary"
            fontSize="sm"
            fontWeight="normal"
            maxWidth="calc(100% - 32px)"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            #{truncateString(tokenId.toString(), 16, 4)}
          </Badge>
        </Box>
        <Flex justifyContent="center" maxWidth="100%" overflow="hidden">
          {isMetadataPending ? (
            <Skeleton height="24px" width="120px" />
          ) : (
            <Text
              textStyle="bodyL"
              color="text-primary"
              textAlign="center"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              maxWidth="100%"
              title={nftName}
            >
              {truncateString(nftName, 24, 6)}
            </Text>
          )}
        </Flex>
      </Card>

      <Stack gap={4}>
        <ChakraLink
          asChild
          color="text-link"
          textStyle="bodyL"
          fontWeight="semibold"
          _hover={{ textDecoration: 'underline' }}
        >
          <Link href={collectionHref}>{collection.name}</Link>
        </ChakraLink>
        {description && (
          <Text textStyle="bodyS" color="text-primary" lineHeight="1.6">
            {description}
          </Text>
        )}
      </Stack>
    </Stack>
  )
}
