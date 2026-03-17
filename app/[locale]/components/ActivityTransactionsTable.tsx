'use client'

import { useTranslation } from 'react-i18next'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow } from '@/components/ui/Table'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { TxStatusIcon } from '@/components/TxStatus'
import { TransactionStatus } from '@/lib/types'
import type { AddressString, ExpandedBlock, HexString, TransactionType } from '@/lib/schemas'

type TransactionWithBlockInfo = ExpandedBlock['transactions'][number] & {
  blockNumber: number
  blockTimestamp: number
}

interface ActivityTransactionRow extends TableRow {
  id: HexString
  type: TransactionType
  clausesCount: number
  origin: AddressString
  status: TransactionStatus
}

interface Props {
  transactions: TransactionWithBlockInfo[]
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
    type: tx.type,
    clausesCount: tx.clauses.length,
    origin: tx.origin,
    status: tx.reverted ? TransactionStatus.REVERTED : TransactionStatus.SUCCESS,
  }))

  return <DataTable columns={columns} rows={rows} />
}
