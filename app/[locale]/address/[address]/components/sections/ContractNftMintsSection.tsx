'use client'

import { Heading, Link as ChakraLink } from '@chakra-ui/react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { NoMints } from '@/components/NoResults'
import { Card } from '@/components/ui/Card'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow, TableSkeleton } from '@/components/ui/Table'
import { useIsErc721Contract } from '@/hooks/useIsErc721Contract'
import { useNetworkAwareHref } from '@/hooks/useNetworkAwareHref'
import type { AddressString } from '@/lib/schemas'
import { useErc721RecentMints } from '@/services/thor/tokens/erc721'

const RECENT_MINTS_LIMIT = 10

const TokenIdLink = ({ contractAddress, tokenId }: { contractAddress: AddressString; tokenId: bigint }) => {
  const href = useNetworkAwareHref(`/nft/${contractAddress}/${tokenId.toString()}`)
  return (
    <ChakraLink asChild color="text-link" textDecoration="none" _hover={{ textDecoration: 'underline' }}>
      <Link href={href}>#{tokenId.toString()}</Link>
    </ChakraLink>
  )
}

interface MintRow extends TableRow {
  age: number
  tokenId: bigint
  owner: AddressString
  txId: string
}

/**
 * Shown only on ERC-721 contract pages. Lists the most recently minted tokens of the collection,
 * each linking to its token detail page. Data is read on-chain (see useErc721RecentMints).
 */
export const ContractNftMintsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const isErc721 = useIsErc721Contract(address)

  const { data: mints, isLoading } = useErc721RecentMints({
    contractAddress: address,
    limit: RECENT_MINTS_LIMIT,
    enabled: isErc721,
  })

  if (!isErc721) return null

  const columns: Column<MintRow>[] = [
    { key: 'age', label: t('Age'), Cell: ({ row }) => <AgeText timestamp={row.age} /> },
    {
      key: 'tokenId',
      label: t('Token ID'),
      Cell: ({ row }) => <TokenIdLink contractAddress={address} tokenId={row.tokenId} />,
    },
    { key: 'owner', label: t('Owner'), Cell: ({ row }) => <CopyableAddressLink truncate address={row.owner} /> },
    {
      key: 'txId',
      label: t('Tx ID'),
      Cell: ({ row }) => <CopyableTransactionIdLink txId={row.txId as `0x${string}`} />,
    },
  ]

  const rows: MintRow[] = (mints ?? []).map(mint => ({
    id: mint.txId + mint.tokenId.toString(),
    age: mint.blockTimestamp,
    tokenId: mint.tokenId,
    owner: mint.to,
    txId: mint.txId,
  }))

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Latest Minted Tokens')}
      </Heading>

      {isLoading ? <TableSkeleton /> : rows.length === 0 ? <NoMints /> : <DataTable columns={columns} rows={rows} />}
    </Card>
  )
}
