'use client'

import { Flex, Grid, Heading, IconButton, NativeSelect, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { NoTokens } from '@/components/NoResults'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { type Erc721, useErc721Contracts } from '@/services/thor/tokens/erc721'
import { useAccountErc721 } from '@/services/veworld-indexer/hooks'
import { NftCollectionCards } from './components/NftCollectionCards'
import { NftGridSkeleton } from './components/NftGridSkeleton'
import type { Erc721WithTokenIds } from './types'

const PAGE_SIZE_OPTIONS = [8, 12, 16] as const

export const AccountNftsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: accountErc721Map, isPending: isLoadingErc721 } = useAccountErc721({
    params: { address, page, size: pageSize },
  })

  const { data: erc721CollectionsMap, isPending: isPendingErc721List } = useErc721Contracts({
    contractAddressList: new Set<AddressString>(Array.from(accountErc721Map?.data.keys() ?? [])),
  })

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const isPending = isLoadingErc721 || isPendingErc721List
  const hasNfts = accountErc721Map && accountErc721Map.data.size > 0 && erc721CollectionsMap.size > 0
  const pagination = accountErc721Map?.pagination

  const accountErc721 = useMemo(() => {
    if (!hasNfts) return []
    return mapTokenIdsToCollections(erc721CollectionsMap, accountErc721Map.data)
  }, [hasNfts, erc721CollectionsMap, accountErc721Map?.data])

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('NFTs Inventory')}
      </Heading>

      {isPending ? (
        <NftGridSkeleton count={pageSize} />
      ) : !hasNfts ? (
        <NoTokens />
      ) : (
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
          {accountErc721.map(collection => (
            <NftCollectionCards key={collection.address} collection={collection} />
          ))}
        </Grid>
      )}

      {hasNfts && (
        <Flex justifyContent="flex-end" alignItems="center" gap={4} pt={4} flexWrap="wrap">
          <Text textStyle="bodyS" color="text-secondary">
            {t('Rows per page')}
          </Text>
          <NativeSelect.Root size="sm" width="70px">
            <NativeSelect.Field value={pageSize} onChange={e => handlePageSizeChange(Number(e.target.value))}>
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Text textStyle="bodyS" color="text-secondary">
            {t('Page')} {page + 1}
          </Text>
          <Flex gap={1}>
            <IconButton
              aria-label={t('Previous page')}
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <LuChevronLeft />
            </IconButton>
            <IconButton
              aria-label={t('Next page')}
              variant="ghost"
              size="sm"
              disabled={!pagination?.hasNext}
              onClick={() => setPage(p => p + 1)}
            >
              <LuChevronRight />
            </IconButton>
          </Flex>
        </Flex>
      )}
    </Card>
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
