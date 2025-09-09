import { Table } from '@chakra-ui/react'
import { TransactionLink } from '@/components/ui/Links'
import { VETBalance } from '@/components/ui/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import type { Clause, HexString } from '@/lib/schemas'
import { InputData } from './InputData'

export const ClauseDetailsTable = ({
  clause,
  txId,
  clauseIndex,
}: {
  clause: Clause
  txId: HexString
  clauseIndex: number
}) => {
  const items = [
    {
      name: 'Transaction',
      value: <TransactionLink transactionId={txId}>{txId}</TransactionLink>,
    },
    { name: 'Index', value: `# ${clauseIndex.toLocaleString()}` },
    { name: 'To', value: clause.to ? <VnsBadgeOrAddressLink address={clause.to} /> : 'N/A' },
    { name: 'Value', value: <VETBalance balance={clause.value} /> },
    { name: 'Input data', value: <InputData rawData={clause.data} /> },
  ]

  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Body>
          {items.map(item => (
            <Table.Row key={item.name}>
              <Table.Cell>{item.name}</Table.Cell>
              <Table.Cell>{item.value}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
