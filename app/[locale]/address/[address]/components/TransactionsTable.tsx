import { Table } from '@chakra-ui/react'
import { PaidGasFees } from '@/components/PaidGasFees'
import { TxStatus } from '@/components/TxStatus'
import { BlockLink, TransactionClausesLink, TransactionLink } from '@/components/ui-legacy/Links'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { AddressString } from '@/lib/schemas'
import { formatDateFromTimestamp } from '@/lib/utils/date'
import type { IndexerContractTransaction, IndexerTransaction } from '@/services/veworld-indexer/schemas'

export const TransactionsTable = ({
  address,
  transactions,
}: {
  address: AddressString
  transactions: IndexerContractTransaction[] | IndexerTransaction[]
}) => {
  const items = transactions.map(tx => ({
    key: tx.id,
    id: <TransactionLink transactionId={tx.id}>{tx.id}</TransactionLink>,
    status: <TxStatus status={tx.reverted ? 'reverted' : 'success'} />,
    origin: <VnsBadgeOrAddressLink address={tx.origin} truncateAddress />,
    block: <BlockLink blockId={tx.blockId}>{tx.blockNumber}</BlockLink>,
    timestamp: formatDateFromTimestamp(tx.blockTimestamp),
    paid: (
      <PaidGasFees
        paid={tx.paid}
        delegator={tx.gasPayer.toLowerCase() === address.toLowerCase() ? null : tx.gasPayer}
      />
    ),
    clauses: <TransactionClausesLink transactionId={tx.id}>{`${tx.clauses.length} Clauses`}</TransactionClausesLink>,
  }))

  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader>ID</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Block</Table.ColumnHeader>
            <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
            <Table.ColumnHeader>Origin</Table.ColumnHeader>
            <Table.ColumnHeader>Clauses</Table.ColumnHeader>
            <Table.ColumnHeader>Paid</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {items.map(item => (
            <Table.Row key={item.key}>
              <Table.Cell maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {item.id}
              </Table.Cell>
              <Table.Cell>{item.status}</Table.Cell>
              <Table.Cell w="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {item.block}
              </Table.Cell>
              <Table.Cell>{item.timestamp}</Table.Cell>
              <Table.Cell w="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {item.origin}
              </Table.Cell>
              <Table.Cell overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {item.clauses}
              </Table.Cell>
              <Table.Cell>{item.paid}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
