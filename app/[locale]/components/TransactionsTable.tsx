'use client'

import { Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { BaseLink, CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import type { AddressString, ExpandedBlock, HexString, TransactionType } from '@/lib/schemas'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import type { TableRow } from '@/components/ui/Table'
import { TxStatusIcon } from '@/components/TxStatus'
import { Balance } from '@/components/ui/Balance'
import { TransactionStatus } from '@/lib/types'

interface TransactionRow extends TableRow {
  id: HexString
  origin: AddressString
  type: TransactionType
  clausesCount: number
  feeDelegatedTo: AddressString
  // co2e: string // TODO: find out how to get co2e from transaction
  vthoBurn: bigint
  status: TransactionStatus
}

export const TransactionsTable = ({ transactions }: { transactions: ExpandedBlock['transactions'] }) => {
  const { t } = useTranslation()

  const columns: Column<TransactionRow>[] = [
    {
      key: 'id',
      label: t('Tx ID'),
      Cell: ({ row }) => (
        <BaseLink href={`/transaction/${row.txId}`} maxW="150px">
          <Text overflow="hidden" textOverflow="ellipsis">
            {row.txId}
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
    { key: 'vthoBurn', label: t('VTHO Burn'), Cell: ({ row }) => <Balance balance={row.vthoBurn} /> },
    {
      key: 'feeDelegatedTo',
      label: t('Fee delegated to'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.feeDelegatedTo} />,
    },
    // { key: 'co2e', label: t('Co2e') }, // TODO: find out how to get co2e from transaction
    { key: 'status', label: t('Status'), Cell: ({ row }) => <TxStatusIcon status={row.status} /> },
  ]

  const rows = transactions.map(transaction => ({
    id: transaction.id,
    origin: transaction.origin,
    type: transaction.type,
    clausesCount: transaction.clauses.length,
    feeDelegatedTo: transaction.gasPayer,
    // co2e: ???, // TODO: find out how to get co2e from transaction
    vthoBurn: transaction.paid,
    status: transaction.reverted ? TransactionStatus.REVERTED : TransactionStatus.SUCCESS,
  }))

  return <DataTable columns={columns} rows={rows} />
}
