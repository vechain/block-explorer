'use client'

import { useTranslation } from 'react-i18next'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow } from '@/components/ui/Table'
import { TxStatusIcon } from '@/components/TxStatus'
import { TransactionStatus } from '@/lib/types'
import type { AddressString, ExpandedBlock, HexString } from '@/lib/schemas'

type TransactionWithBlockInfo = ExpandedBlock['transactions'][number] & {
  blockNumber: number
  blockTimestamp: number
}

interface ActivityTransactionRow extends TableRow {
  id: HexString
  origin: AddressString
  status: TransactionStatus
}

export const ActivityTransactionsTable = ({ transactions }: { transactions: TransactionWithBlockInfo[] }) => {
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
    { key: 'status', label: t('Status'), Cell: ({ row }) => <TxStatusIcon status={row.status} /> },
  ]

  const rows: ActivityTransactionRow[] = transactions.map(tx => ({
    id: tx.id,
    origin: tx.origin,
    status: tx.reverted ? TransactionStatus.REVERTED : TransactionStatus.SUCCESS,
  }))

  return <DataTable columns={columns} rows={rows} />
}
