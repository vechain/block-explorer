import { isNotNullish } from '@/lib/type-predicates'
import { useErc721Tokens } from '@/services/thor/tokens/erc721'
import type { Erc721WithTokenIds } from '../types'
import { NftCard } from './NftCard'

interface NftCollectionCardsProps {
  collection: Erc721WithTokenIds
}

export const NftCollectionCards = ({ collection }: NftCollectionCardsProps) => {
  const { data: tokens, isPending } = useErc721Tokens({
    contract: collection.contract,
    tokenIds: collection.tokenIds,
  })

  if (isPending) return null

  return tokens
    .filter(isNotNullish)
    .map(token => (
      <NftCard
        key={`${collection.address}-${token.tokenId}`}
        token={token}
        collectionName={collection.name}
        contractAddress={collection.address}
      />
    ))
}
