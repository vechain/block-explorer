'use client'

import { Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { BaseLink, CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow } from '@/components/ui/Table'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import type { AddressString, ExpandedBlock, HexString, TransactionType } from '@/lib/schemas'

type TransactionWithBlockInfo = ExpandedBlock['transactions'][number] & {
  blockNumber: number
  blockTimestamp: number
}

interface ActivityTransactionRow extends TableRow {
  id: HexString
  age: number
  origin: AddressString
  type: TransactionType
  clausesCount: number
}

export const ActivityTransactionsTable = ({ transactions }: { transactions: TransactionWithBlockInfo[] }) => {
  const { t } = useTranslation()

  const columns: Column<ActivityTransactionRow>[] = [
    { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
    {
      key: 'id',
      label: t('Tx ID'),
      Cell: ({ row }) => (
        <BaseLink href={`/transaction/${row.id}`} maxW="150px">
          <Text overflow="hidden" textOverflow="ellipsis">
            {row.id}
          </Text>
        </BaseLink>
      ),
    },
    {
      key: 'type',
      label: t('Type'),
      Cell: ({ row }) => <TxTypeBadge textStyle="bodyS" type={row.type} />,
    },
    { key: 'clausesCount', label: t('Clauses'), Cell: ({ row }) => row.clausesCount.toString() },
    {
      key: 'origin',
      label: t('Origin'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.origin} />,
    },
  ]

  const rows: ActivityTransactionRow[] = transactions.map(tx => ({
    id: tx.id,
    age: tx.blockTimestamp,
    origin: tx.origin,
    type: tx.type,
    clausesCount: tx.clauses.length,
  }))

  return <DataTable columns={columns} rows={rows} />
}
