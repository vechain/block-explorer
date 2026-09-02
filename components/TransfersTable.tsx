'use client'

import { Flex, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type CellComponentProps, type Column, DataTable } from '@/components/ui/Table'
import { AmountWithHover } from '@/components/ui-legacy/AmountWithHover'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'
import { useErc20Contracts } from '@/services/thor/tokens/erc20'
import { useErc721Contracts } from '@/services/thor/tokens/erc721'
import { isNotNullish } from '@/lib/type-predicates'
import { truncateString } from '@/lib/utils/truncateString'

type TransferType = 'FUNGIBLE_TOKEN' | 'NFT' | 'VET' | 'SEMI_FUNGIBLE_TOKEN' | 'all'

type TransferInput = IndexerTransfer

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

  // Get unique token addresses for ERC721 / ERC1155 (NFT + semi-fungible)
  const nftTokenAddresses = useMemo(
    () =>
      filteredTransfers
        .filter(
          transfer =>
            (transfer.eventType === 'NFT' || transfer.eventType === 'SEMI_FUNGIBLE_TOKEN') && transfer.tokenAddress,
        )
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
  const hasSemiFungible = filteredTransfers.some(t => t.eventType === 'SEMI_FUNGIBLE_TOKEN')

  const LastColumnCell = useMemo(() => {
    return function LastColumnCell(props: CellComponentProps) {
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

      // Handle ERC1155 (semi-fungible): collectionName? #tokenId × value
      if (transfer.eventType === 'SEMI_FUNGIBLE_TOKEN') {
        const erc1155 = transfer.tokenAddress ? erc721Map?.get(transfer.tokenAddress) : null
        const rawCollectionName = erc1155?.name ?? ''
        const collectionName = rawCollectionName ? truncateString(rawCollectionName, 16, 4) : ''
        const tokenId = transfer.tokenId ? truncateString(transfer.tokenId, 12, 4) : null

        return (
          <Flex alignItems="center" gap={1} flexWrap="wrap">
            {collectionName && (
              <Text as="span" color="text-primary" fontSize="sm">
                {collectionName}
              </Text>
            )}
            {tokenId && (
              <Text as="span" color="text-secondary" fontSize="sm">
                #{tokenId}
              </Text>
            )}
            {transfer.value > 0n && (
              <>
                <Text as="span" color="text-secondary" fontSize="sm">
                  ×
                </Text>
                <AmountWithHover amount={transfer.value} decimals={0} />
              </>
            )}
            {!collectionName && !tokenId && transfer.value === 0n && (
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

  // Determine column label based on transfer types. Mixed feeds get an empty
  // header — each row's cell renders its own type-appropriate content.
  const lastColumnLabel = useMemo(() => {
    const distinctTypes = (hasFungibleTokens ? 1 : 0) + (hasNfts ? 1 : 0) + (hasSemiFungible ? 1 : 0)
    if (distinctTypes <= 1) {
      if (hasNfts) return t('NFT')
      if (hasSemiFungible) return t('Token')
      return t('Amount')
    }
    return ''
  }, [hasNfts, hasFungibleTokens, hasSemiFungible, t])

  const columnsMemo = useMemo(
    () =>
      [
        {
          key: 'txId',
          label: t('Tx ID'),
          Cell: ({ value }) => <CopyableTransactionIdLink txId={value as `0x${string}`} />,
        },
        { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
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
