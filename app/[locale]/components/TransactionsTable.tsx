'use client'

import { Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { BaseLink, CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import type { ExpandedBlock } from '@/lib/schemas'

// TODO completed transacitons table once deisgn is completed
export const TransactionsTable = ({ transactions }: { transactions: ExpandedBlock['transactions'] }) => {
  const { t } = useTranslation()

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'ID',
      label: t('ID'),
      Cell: ({ row }) => (
        <BaseLink href={`/transaction/${row.id}`} maxW="150px">
          <Text overflow="hidden" textOverflow="ellipsis">
            {row.id}
          </Text>
        </BaseLink>
      ),
    },
    {
      key: 'origin',
      label: t('Origin'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.origin} />,
    },
    {
      key: 'gasPayer',
      label: t('Gas payer'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.gasPayer} />,
    },
    { key: 'clauses', label: t('Clauses') },
    { key: 'gas', label: t('Gas') },
  ]

  const rows = transactions.map(transaction => ({
    id: transaction.id,
    origin: transaction.origin,
    gasPayer: transaction.gasPayer,
    clauses: transaction.clauses.length,
  }))

  return <DataTable columns={columns} rows={rows} />
}
