import { Text } from '@chakra-ui/react'
import { BaseLink, CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import type { ExpandedBlock } from '@/lib/schemas'

// TODO completed transacitons table once deisgn is completed
export const TransactionsTable = ({ transactions }: { transactions: ExpandedBlock['transactions'] }) => {
  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'ID',
      label: 'ID',
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
      label: 'Origin',
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.origin} />,
    },
    {
      key: 'gasPayer',
      label: 'Gas payer',
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.gasPayer} />,
    },
    { key: 'clauses', label: 'Clauses' },
    { key: 'gas', label: 'Gas' },
  ]

  const rows = transactions.map(transaction => ({
    id: transaction.id,
    origin: transaction.origin,
    gasPayer: transaction.gasPayer,
    clauses: transaction.clauses.length,
  }))

  return <DataTable columns={columns} rows={rows} />
}
