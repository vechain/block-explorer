'use client'

import { Flex, Heading, useBreakpointValue } from '@chakra-ui/react'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCircleCheck, LuLeaf } from 'react-icons/lu'
import { NoTransactions } from '@/components/NoResults'
import { AgeText } from '@/components/ui/AgeText'
import { Card } from '@/components/ui/Card'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { type Column, DataTable, TableSkeleton } from '@/components/ui/Table'
import type { AddressString } from '@/lib/schemas'
const truncateHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-4)}`
import { formatAmount } from '@/lib/utils/units'
import { useFormatNumber } from '@/hooks/useFormatting'
import { useAccountTransactions } from '@/services/veworld-indexer/hooks'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

const TxStatusIcon = ({ status }: { status: 'success' | 'reverted' | 'pending' }) => {
  switch (status) {
    case 'success':
      return <LuCircleCheck color="var(--chakra-colors-success-text)" width={16} height={16} />
    case 'reverted':
      return <Image src="/icons/revert.svg" alt="Reverted" width={12} height={12} />
    case 'pending':
      return <Image src="/icons/pending.svg" alt="Pending" width={16} height={16} />
  }
}

export const AccountTransactionsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: transactions, isPending } = useAccountTransactions({
    params: { origin: address, page, size: pageSize },
  })

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const columns: Column<TransactionRow>[] = useMemo(
    () => [
      {
        key: 'status',
        label: t('Status'),
        Cell: ({ row }) => <TxStatusIcon status={row.status} />,
      },
      {
        key: 'txId',
        label: t('Tx ID'),
        Cell: ({ row }) => (
          <CopyableLink href={`/transaction/${row.txId}`} value={row.txId}>
            {truncateHash(row.txId)}
          </CopyableLink>
        ),
      },
      {
        key: 'age',
        label: t('Age'),
        Cell: ({ row }) => <AgeText timestamp={row.age} />,
      },
      {
        key: 'block',
        label: t('Block'),
        Cell: ({ row }) => (
          <CopyableLink href={`/block/${row.blockId}`} value={row.blockNumber.toString()}>
            #{formatNumber(row.blockNumber)}
          </CopyableLink>
        ),
      },
      {
        key: 'origin',
        label: t('Origin'),
        Cell: ({ row }) => <CopyableAddressLink truncate address={row.origin} />,
      },
      {
        key: 'clauses',
        label: t('Clauses'),
        Cell: ({ row }) => row.clauses.toString(),
      },
      {
        key: 'fee',
        label: t('Fee'),
        Cell: ({ row }) => (
          <Flex alignItems="center" gap={1}>
            {formatAmount({ amount: row.paid })[0]}
            <Image src="/icons/vtho.svg" alt="VTHO" width={8} height={8} />
            {row.isDelegated && <Image src="/icons/signed.svg" alt="Delegated" width={16} height={16} />}
          </Flex>
        ),
      },
      {
        key: 'co2e',
        label: t('Co2e'),
        Cell: ({ row }) => (
          <Flex alignItems="center" gap={1}>
            {row.co2e} {t('g')}
            <LuLeaf color="var(--chakra-colors-success-text)" width={16} height={16} />
          </Flex>
        ),
      },
    ],
    [t, formatNumber],
  )

  const rows: TransactionRow[] = useMemo(
    () =>
      (transactions?.data ?? []).map(tx => ({
        id: tx.id,
        age: tx.blockTimestamp,
        blockNumber: tx.blockNumber,
        blockId: tx.blockId,
        txId: tx.id,
        origin: tx.origin,
        clauses: tx.clauses?.length ?? 0,
        paid: tx.paid,
        isDelegated: tx.gasPayer.toLowerCase() !== tx.origin.toLowerCase(),
        co2e: '-',
        vthoBurn: tx.paid,
        status: tx.reverted ? ('reverted' as const) : ('success' as const),
      })),
    [transactions?.data],
  )

  const containerProps = useBreakpointValue({ base: { m: -4, p: 4 }, md: { m: -5, p: 5 } })

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Transactions')}
      </Heading>

      {isPending ? (
        <TableSkeleton />
      ) : !transactions || transactions.data.length === 0 ? (
        <NoTransactions />
      ) : (
        <DataTable columns={columns} rows={rows} containerProps={containerProps} gridProps={{ w: 'fit-content' }} />
      )}

      {transactions && transactions.data.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={transactions.pagination.hasNext}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </Card>
  )
}

type TransactionRow = {
  id: string
  age: number
  blockNumber: number
  blockId: string
  txId: string
  origin: AddressString
  clauses: number
  paid: bigint
  isDelegated: boolean
  co2e: string
  vthoBurn: bigint
  status: 'success' | 'reverted' | 'pending'
}
