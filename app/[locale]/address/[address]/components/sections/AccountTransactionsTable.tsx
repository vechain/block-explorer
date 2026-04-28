'use client'

import { useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { NoTransactions } from '@/components/NoResults'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type Column, DataTable, TableRow, TableSkeleton } from '@/components/ui/Table'
import type { AddressString, HexString, TransactionType } from '@/lib/schemas'
import { TxStatusIcon } from '@/components/TxStatus'
import { TransactionStatus } from '@/lib/types'
import { IndexerTransaction } from '@/services/veworld-indexer/schemas'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { Balance } from '@/components/ui/Balance'

interface TransactionRow extends TableRow {
  age: number
  id: HexString
  origin: AddressString
  type: TransactionType
  feeDelegatedTo: AddressString
  vthoPaid: bigint
  status: TransactionStatus
}

export const AccountTransactionsTable = ({
  transactions,
  isLoading,
}: {
  transactions: IndexerTransaction[]
  isLoading: boolean
}) => {
  const { t } = useTranslation()

  const columns: Column<TransactionRow>[] = [
    {
      key: 'age',
      label: t('Age'),
      Cell: ({ row }) => <AgeText timestamp={row.age} />,
    },
    {
      key: 'id',
      label: t('Tx ID'),
      Cell: ({ row }) => <CopyableTransactionIdLink txId={row.id} />,
    },
    {
      key: 'type',
      label: t('Type'),
      Cell: ({ row }) => <TxTypeBadge textStyle="bodyS" type={row.type} />,
    },
    {
      key: 'origin',
      label: t('Origin'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.origin} />,
    },
    { key: 'vthoPaid', label: t('VTHO Paid'), Cell: ({ row }) => <Balance balance={row.vthoPaid} /> },
    {
      key: 'feeDelegatedTo',
      label: t('Fee delegated to'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.feeDelegatedTo} />,
    },
    // {
    //   key: 'co2e',
    //   label: t('Co2e'),
    //   Cell: ({ row }) => (
    //     <Flex alignItems="center" gap={1}>
    //       {row.co2e} {t('g')}
    //       <LuLeaf color="var(--chakra-colors-success-text)" width={16} height={16} />
    //     </Flex>
    //   ),
    // }, // TODO: find out how to get co2e from transaction
    { key: 'status', label: t('Status'), Cell: ({ row }) => <TxStatusIcon status={row.status} /> },
  ]

  const rows: TransactionRow[] = transactions.map(tx => ({
    id: tx.id,
    age: tx.blockTimestamp,
    origin: tx.origin,
    type: tx.type,
    feeDelegatedTo: tx.gasPayer,
    // co2e: '-', // TODO: find out how to get co2e from transaction
    vthoPaid: tx.paid,
    status: tx.reverted ? TransactionStatus.REVERTED : TransactionStatus.SUCCESS,
  }))

  const containerProps = useBreakpointValue({ base: { m: -4, p: 4 }, md: { m: -5, p: 5 } })

  if (isLoading) {
    return <TableSkeleton />
  }

  if (transactions.length === 0) {
    return <NoTransactions description={t('This account has not made any transactions yet')} />
  }

  return <DataTable columns={columns} rows={rows} containerProps={containerProps} gridProps={{ w: 'fit-content' }} />
}
