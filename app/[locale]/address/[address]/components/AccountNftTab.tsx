import { Box, Card, Flex, Separator, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { NoTokens } from '@/components/NoResults'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import type { AddressString } from '@/lib/schemas'
import { isNotNullish } from '@/lib/type-predicates'
import { parseNftMetadataUri, useNftMetadata } from '@/services/nft-metadata'
import { type Erc721, type Erc721Token, useErc721Contracts, useErc721Tokens } from '@/services/thor/tokens/erc721'
import { useAccountErc721 } from '@/services/veworld-indexer/hooks'

const PAGE_SIZE = 30

export const AccountNftsTab = ({ address }: { address: AddressString }) => {
  const { data: accountErc721Map, isLoading: isLoadingErc721 } = useAccountErc721({
    params: { address, size: PAGE_SIZE },
  })

  const { data: erc721CollectionsMap, isPending: isPendingErc721List } = useErc721Contracts({
    contractAddressList: new Set<AddressString>(Array.from(accountErc721Map?.data.keys() ?? [])),
  })

  if (isLoadingErc721 || isPendingErc721List) return <div>Loading...</div>

  if (!accountErc721Map || accountErc721Map?.data.size === 0 || erc721CollectionsMap.size === 0) return <NoTokens />

  const accountErc721 = mapTokenIdsToCollections(erc721CollectionsMap, accountErc721Map.data)

  return accountErc721.map(erc721 => <Erc721Collection key={erc721.address} token={erc721} />)
}

const Erc721Collection = ({ token }: { token: Erc721WithTokenIds }) => {
  const erc721Tokens = useErc721Tokens({ contract: token.contract, tokenIds: token.tokenIds })

  return (
    <ErrorBoundary>
      <Box mt={8}>
        <Link href={`/address/${token.address}`}>
          <Text fontWeight="bold">{token.name}</Text>
          <Text as="span" color="gray.500">
            {token.symbol}
          </Text>
        </Link>
        <Separator my={2} />
        <Flex flexWrap="wrap" gap={2}>
          {erc721Tokens.data
            .filter(isNotNullish)
            .sort((a, b) => a.tokenId.toString().localeCompare(b.tokenId.toString()))
            .map(token => (
              <Erc721TokenCard key={token.tokenUri} token={token} />
            ))}
        </Flex>
      </Box>
    </ErrorBoundary>
  )
}

const Erc721TokenCard = ({ token }: { token: Erc721Token }) => {
  const { data: metadata, isPending } = useNftMetadata(token.tokenUri)

  if (isPending) return <Text>Loading...</Text>

  if (!metadata) return <NoMetadataCard token={token} />

  return (
    <ErrorBoundary>
      <Card.Root width="300px" css={{ _hover: { bg: 'gray.100' } }}>
        <Card.Body gap={2}>
          <Flex flexDirection="column" gap={2}>
            <Text fontWeight="bold"># {token.tokenId}</Text>

            <ImageWithFallback src={parseNftMetadataUri(metadata.image)} alt={metadata.name} width={100} height={100} />

            <Flex flexDirection="column" gap={2}>
              <Text fontWeight="bold">Description:</Text>
              <Text fontSize="sm">{metadata.description}</Text>
            </Flex>

            {metadata.attributes.length > 0 && (
              <Flex flexDirection="column" gap={2}>
                <Text fontWeight="bold">Attributes:</Text>
                {metadata.attributes.map(attribute => (
                  <Flex key={`${attribute.traitType}-${attribute.value}`} gap={2}>
                    <Text fontSize="sm" fontWeight="bold">
                      {attribute.traitType}:
                    </Text>
                    <Text fontSize="sm">{attribute.value}</Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card.Body>
      </Card.Root>
    </ErrorBoundary>
  )
}

const NoMetadataCard = ({ token }: { token: Erc721Token }) => {
  return (
    <Card.Root width="300px" css={{ _hover: { bg: 'gray.100' } }}>
      <Card.Body gap={2}>
        <Flex flexDirection="column" gap={2}>
          <Text fontWeight="bold"># {token.tokenId}</Text>
          <Text>Metadata not found at this uri:</Text>
          <Text fontSize="sm">{token.tokenUri}</Text>
        </Flex>
      </Card.Body>
    </Card.Root>
  )
}

function mapTokenIdsToCollections(
  erc721CollectionsMap: Map<AddressString, Erc721>,
  accountErc721Map: Map<AddressString, Set<bigint>>,
) {
  const result: Erc721WithTokenIds[] = []

  for (const [address, erc721] of erc721CollectionsMap.entries()) {
    const tokenIds = accountErc721Map.get(address)
    if (tokenIds) {
      result.push({ ...erc721, tokenIds: Array.from(tokenIds) })
    }
  }

  return result
}

type Erc721WithTokenIds = Erc721 & { tokenIds: bigint[] }
