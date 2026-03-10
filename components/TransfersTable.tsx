'use client'

import { Flex, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type CellComponentProps, type Column, DataTable } from '@/components/ui/Table'
import { AmountWithHover } from '@/components/ui-legacy/AmountWithHover'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'
import type { TransferFromBlock } from '@/services/veworld-indexer/recent-activity'
import { useErc20Contracts } from '@/services/thor/tokens/erc20'
import { useErc721Contracts } from '@/services/thor/tokens/erc721'
import { isNotNullish } from '@/lib/type-predicates'
import { truncateString } from '@/lib/utils/truncateString'

type TransferType = 'FUNGIBLE_TOKEN' | 'NFT' | 'VET' | 'all'

// Union type to support both IndexerTransfer and TransferFromBlock
type TransferInput = IndexerTransfer | TransferFromBlock

type TransfersTableProps = {
  transfers: TransferInput[]
  transferType?: TransferType
}

export const TransfersTable = ({ transfers, transferType = 'all' }: TransfersTableProps) => {
  const { t } = useTranslation()

  // Filter transfers by type if specified
  const filteredTransfers = useMemo(() => {
    if (transferType === 'all') return transfers
    return transfers.filter(transfer => transfer.eventType === transferType)
  }, [transfers, transferType])

  // Get unique token addresses for ERC20 (fungible tokens)
  const fungibleTokenAddresses = useMemo(
    () =>
      filteredTransfers
        .filter(transfer => transfer.eventType === 'FUNGIBLE_TOKEN' && transfer.tokenAddress)
        .map(transfer => transfer.tokenAddress!)
        .filter(isNotNullish),
    [filteredTransfers],
  )

  // Get unique token addresses for ERC721 (NFTs)
  const nftTokenAddresses = useMemo(
    () =>
      filteredTransfers
        .filter(transfer => transfer.eventType === 'NFT' && transfer.tokenAddress)
        .map(transfer => transfer.tokenAddress!)
        .filter(isNotNullish),
    [filteredTransfers],
  )

  const { data: erc20Map } = useErc20Contracts({
    contractAddressList: useMemo(() => new Set(fungibleTokenAddresses), [fungibleTokenAddresses]),
  })

  const { data: erc721Map } = useErc721Contracts({
    contractAddressList: useMemo(() => new Set(nftTokenAddresses), [nftTokenAddresses]),
  })

  const transferMap = useMemo(() => {
    const map = new Map<string, TransferInput>()
    filteredTransfers.forEach(transfer => map.set(transfer.id, transfer))
    return map
  }, [filteredTransfers])

  // Determine if we should show Amount or NFT column based on transfer types
  const hasFungibleTokens = filteredTransfers.some(t => t.eventType === 'FUNGIBLE_TOKEN' || t.eventType === 'VET')
  const hasNfts = filteredTransfers.some(t => t.eventType === 'NFT')

  const LastColumnCell = useMemo(() => {
    const CellComponent = (props: CellComponentProps) => {
      const transfer = transferMap.get(props.row.id)
      if (!transfer) return null

      // Handle NFT transfers
      if (transfer.eventType === 'NFT') {
        const erc721 = transfer.tokenAddress ? erc721Map?.get(transfer.tokenAddress) : null
        const rawCollectionName = erc721?.name ?? (transfer.tokenAddress ? '-' : '')
        const rawTokenId = transfer.tokenId ?? '-'
        const collectionName = rawCollectionName ? truncateString(rawCollectionName, 16, 4) : ''
        const tokenId = rawTokenId !== '-' ? truncateString(rawTokenId, 12, 4) : '-'

        return (
          <Flex alignItems="center" gap={1} flexWrap="wrap">
            {collectionName && (
              <Text as="span" color="text-primary" fontSize="sm">
                {collectionName}
              </Text>
            )}
            {tokenId && tokenId !== '-' && (
              <Text as="span" color="text-secondary" fontSize="sm">
                #{tokenId}
              </Text>
            )}
            {!collectionName && tokenId === '-' && (
              <Text as="span" color="text-secondary" fontSize="sm">
                -
              </Text>
            )}
          </Flex>
        )
      }

      // Handle fungible token transfers (FUNGIBLE_TOKEN or VET)
      const token = transfer.tokenAddress ? erc20Map?.get(transfer.tokenAddress) : null
      const decimals = token?.decimals ?? 18
      const tokenSymbol =
        transfer.eventType === 'VET' ? 'VET' : (token?.symbol ?? (transfer.tokenAddress ? '-' : 'VET'))

      return (
        <Flex alignItems="center" gap={1}>
          <AmountWithHover amount={transfer.value} decimals={decimals} />
          {tokenSymbol && (
            <Text color="text-secondary" fontSize="sm">
              {tokenSymbol}
            </Text>
          )}
        </Flex>
      )
    }
    CellComponent.displayName = 'LastColumnCell'
    return CellComponent
  }, [transferMap, erc20Map, erc721Map])

  const rows = useMemo(
    () =>
      filteredTransfers.map(transfer => ({
        id: transfer.id,
        age: transfer.blockTimestamp,
        txId: transfer.txId,
        from: transfer.from,
        to: transfer.to,
        lastColumn: '',
      })),
    [filteredTransfers],
  )

  // Determine column label based on transfer types
  const lastColumnLabel = useMemo(() => {
    if (hasNfts && !hasFungibleTokens) return t('NFT')
    if (hasFungibleTokens && !hasNfts) return t('Amount')
    // Mixed types - use a generic label or default to Amount
    return t('Amount')
  }, [hasNfts, hasFungibleTokens, t])

  const columnsMemo = useMemo(
    () =>
      [
        { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
        {
          key: 'txId',
          label: t('Tx ID'),
          Cell: ({ value }) => <CopyableTransactionIdLink txId={value as `0x${string}`} />,
        },
        {
          key: 'from',
          label: t('From'),
          Cell: ({ value }) => <CopyableAddressLink truncate address={value as `0x${string}`} />,
        },
        {
          key: 'to',
          label: t('To'),
          Cell: ({ value }) => <CopyableAddressLink truncate address={value as `0x${string}`} />,
        },
        {
          key: 'lastColumn',
          label: lastColumnLabel,
          Cell: LastColumnCell,
        },
      ] as Column<(typeof rows)[number]>[],
    [t, LastColumnCell, lastColumnLabel],
  )

  return <DataTable columns={columnsMemo} rows={rows} />
}
