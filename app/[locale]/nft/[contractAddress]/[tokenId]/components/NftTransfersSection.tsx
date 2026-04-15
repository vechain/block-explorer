'use client'

import { Flex, Heading, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HiArrowRight, HiOutlineFire, HiOutlineShoppingBag, HiOutlineSparkles } from 'react-icons/hi2'
import { Card } from '@/components/ui/Card'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { AgeText } from '@/components/ui/AgeText'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { type Column, DataTable, TableSkeleton } from '@/components/ui/Table'
import type { AddressString } from '@/lib/schemas'
import { useNftTransfers } from '@/services/veworld-indexer/nft-transfers'
import type { TokenHistoryItem } from '@/services/veworld-indexer/schemas'
import { ZERO_ADDRESS } from '@vechain/sdk-core'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

interface NftTransfersSectionProps {
  contractAddress: AddressString
  tokenId: bigint
}

type TransferType = 'mint' | 'burn' | 'transfer' | 'sale'

/** NFT_SALE rows often omit `from`/`to` but populate `origin` / `owner`. */
const displayParties = (transfer: TokenHistoryItem): { from: string; to: string } => {
  if (transfer.eventName === 'NFT_SALE') {
    return {
      from: transfer.from ?? transfer.origin ?? '',
      to: transfer.to ?? transfer.owner ?? '',
    }
  }
  return {
    from: transfer.from ?? '',
    to: transfer.to ?? '',
  }
}

const getTransferType = (transfer: TokenHistoryItem): TransferType | null => {
  if (transfer.eventName === 'NFT_SALE') return 'sale'

  const { from, to } = displayParties(transfer)
  if (!from || !to) return null
  const nullAddr = ZERO_ADDRESS.toLowerCase()
  if (from.toLowerCase() === nullAddr) return 'mint'
  if (to.toLowerCase() === nullAddr) return 'burn'
  return 'transfer'
}

const transferConfig = {
  mint: { label: 'Mint', icon: HiOutlineSparkles, color: 'green.400' },
  burn: { label: 'Burn', icon: HiOutlineFire, color: 'red.400' },
  transfer: { label: 'Transfer', icon: HiArrowRight, color: 'blue.400' },
  sale: { label: 'Sale', icon: HiOutlineShoppingBag, color: 'purple.400' },
} as const

export const NftTransfersSection = ({ contractAddress, tokenId }: NftTransfersSectionProps) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: transfersData, isPending } = useNftTransfers({
    contractAddress,
    tokenId,
    page,
    size: pageSize,
  })

  const transfers = useMemo(() => transfersData?.data ?? [], [transfersData?.data])
  const pagination = transfersData?.pagination
  const hasTransfers = transfers.length > 0

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const transferMap = useMemo(() => {
    const map = new Map<string, (typeof transfers)[number]>()
    transfers.forEach(transfer => map.set(transfer.id, transfer))
    return map
  }, [transfers])

  const TypeCell = useMemo(() => {
    const Cell = ({ row }: { row: { id: string } }) => {
      const transfer = transferMap.get(row.id)
      if (!transfer) return null
      const type = getTransferType(transfer)
      if (type === null) {
        return (
          <Text textStyle="bodyM" color="text-primary" fontFamily="mono" fontSize="sm">
            {transfer.eventName}
          </Text>
        )
      }
      const { label, icon: Icon, color } = transferConfig[type]
      return (
        <Flex alignItems="center" gap={1.5}>
          <Text textStyle="bodyM" color="text-primary">
            {t(label)}
          </Text>
          <Icon size={16} color={color} />
        </Flex>
      )
    }
    Cell.displayName = 'TypeCell'
    return Cell
  }, [transferMap, t])

  const rows = useMemo(
    () =>
      transfers.map(transfer => {
        const { from, to } = displayParties(transfer)
        return {
          id: transfer.id,
          age: transfer.blockTimestamp * 1000,
          txId: transfer.txId,
          type: '',
          from,
          to,
        }
      }),
    [transfers],
  )

  const columns = useMemo(
    () =>
      [
        { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
        {
          key: 'txId',
          label: t('Tx ID'),
          Cell: ({ value }) => <CopyableTransactionIdLink txId={value as `0x${string}`} />,
        },
        { key: 'type', label: t('Type'), Cell: TypeCell },
        {
          key: 'from',
          label: t('From'),
          Cell: ({ value }) =>
            typeof value === 'string' && value ? (
              <CopyableAddressLink truncate address={value as AddressString} />
            ) : (
              <Text textStyle="bodyM" color="text-secondary">
                —
              </Text>
            ),
        },
        {
          key: 'to',
          label: t('To'),
          Cell: ({ value }) =>
            typeof value === 'string' && value ? (
              <CopyableAddressLink truncate address={value as AddressString} />
            ) : (
              <Text textStyle="bodyM" color="text-secondary">
                —
              </Text>
            ),
        },
      ] as Column<(typeof rows)[number]>[],
    [t, TypeCell],
  )

  return (
    <Card variant="secondary">
      <Heading as="h3" textStyle="displayXs">
        {t('Transfers Events')}
      </Heading>

      {isPending ? (
        <TableSkeleton />
      ) : !hasTransfers ? (
        <Text textStyle="bodyM" color="text-secondary">
          {t('No transfers')}
        </Text>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}

      {hasTransfers && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={pagination?.hasNext ?? false}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          flexWrap="wrap"
        />
      )}
    </Card>
  )
}
