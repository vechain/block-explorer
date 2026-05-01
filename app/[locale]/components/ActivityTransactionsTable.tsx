'use client'

import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow } from '@/components/ui/Table'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { TxStatusIcon } from '@/components/TxStatus'
import { TransactionStatus } from '@/lib/types'
import type { AddressString, HexString, TransactionType } from '@/lib/schemas'
import type { IndexerTransaction } from '@/services/veworld-indexer/schemas'

interface ActivityTransactionRow extends TableRow {
  id: HexString
  age: number
  type: TransactionType
  clausesCount: number
  origin: AddressString
  status: TransactionStatus
}

interface Props {
  transactions: IndexerTransaction[]
  showDetails?: boolean
}

export const ActivityTransactionsTable = ({ transactions, showDetails = false }: Props) => {
  const { t } = useTranslation()

  const columns: Column<ActivityTransactionRow>[] = [
    {
      key: 'id',
      label: t('Tx ID'),
      Cell: ({ row }) => <CopyableTransactionIdLink txId={row.id} />,
    },
    { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
    {
      key: 'origin',
      label: t('Origin'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.origin} />,
    },
    ...(showDetails
      ? ([
          {
            key: 'type',
            label: t('Type'),
            Cell: ({ row }: { row: ActivityTransactionRow }) => <TxTypeBadge textStyle="bodyS" type={row.type} />,
          },
          {
            key: 'clausesCount',
            label: t('Clauses'),
            Cell: ({ row }: { row: ActivityTransactionRow }) => row.clausesCount.toString(),
          },
        ] as Column<ActivityTransactionRow>[])
      : []),
    { key: 'status', label: t('Status'), Cell: ({ row }) => <TxStatusIcon status={row.status} /> },
  ]

  const rows: ActivityTransactionRow[] = transactions.map(tx => ({
    id: tx.id,
    age: tx.blockTimestamp,
    type: tx.type,
    clausesCount: tx.clauseCount ?? tx.clauses?.length ?? 0,
    origin: tx.origin,
    status: tx.reverted ? TransactionStatus.REVERTED : TransactionStatus.SUCCESS,
  }))

  return <DataTable columns={columns} rows={rows} />
}
