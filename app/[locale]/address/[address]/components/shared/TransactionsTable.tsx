import { Table } from '@chakra-ui/react'
import { PaidGasFees } from '@/components/PaidGasFees'
import { TxStatus } from '@/components/TxStatus'
import { BlockLink, TransactionClausesLink, TransactionLink } from '@/components/ui-legacy/Links'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { AddressString } from '@/lib/schemas'
import type { IndexerContractTransaction, IndexerTransaction } from '@/services/veworld-indexer/schemas'
import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatting'

export const TransactionsTable = ({
  address,
  transactions,
}: {
  address: AddressString
  transactions: IndexerContractTransaction[] | IndexerTransaction[]
}) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const items = transactions.map(tx => ({
    key: tx.id,
    id: <TransactionLink transactionId={tx.id}>{tx.id}</TransactionLink>,
    status: <TxStatus status={tx.reverted ? 'reverted' : 'success'} />,
    origin: <VnsBadgeOrAddressLink address={tx.origin} truncateAddress />,
    block: <BlockLink blockId={tx.blockId}>{tx.blockNumber}</BlockLink>,
    timestamp: formatDate(tx.blockTimestamp),
    paid: (
      <PaidGasFees
        paid={tx.paid}
        delegator={tx.gasPayer.toLowerCase() === address.toLowerCase() ? null : tx.gasPayer}
      />
    ),
    clauses: (
      <TransactionClausesLink transactionId={tx.id}>{`${tx.clauses?.length ?? 0} Clauses`}</TransactionClausesLink>
    ),
  }))

  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader>{t('ID')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Block')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Timestamp')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Origin')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Clauses')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Paid')}</Table.ColumnHeader>
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
