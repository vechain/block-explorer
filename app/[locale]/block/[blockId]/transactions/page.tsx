'use client'

import { Stack, Table } from '@chakra-ui/react'
import type { Revision } from '@vechain/sdk-core'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { PaidGasFees } from '@/components/PaidGasFees'
import { TxStatus } from '@/components/TxStatus'
import { TransactionClausesLink, TransactionLink } from '@/components/ui/Links'
import { Subtitle, Title } from '@/components/ui/Typography'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import { parseRevision } from '@/lib/utils/revision'
import { useBlock } from '@/services/thor/hooks'

export default function BlockTransactionsPage({ params }: { params: Promise<{ blockId: string }> }) {
  const { blockId } = use(params)
  const revision = parseRevision(blockId)

  if (!revision) {
    notFound()
  }

  return <BlockTransactionList revision={revision} />
}

const BlockTransactionList = ({ revision }: { revision: Revision }) => {
  const { data: block, isLoading } = useBlock(revision)

  if (isLoading) return <div>Loading...</div>

  if (!block) {
    notFound()
  }

  const items = block.transactions.map(tx => ({
    key: tx.id,
    id: <TransactionLink transactionId={tx.id}>{tx.id}</TransactionLink>,
    origin: <VnsBadgeOrAddressLink address={tx.origin} truncateAddress />,
    paid: <PaidGasFees paid={tx.paid} delegator={tx.delegator ? tx.delegator : null} />,
    clauses: <TransactionClausesLink transactionId={tx.id}>{`${tx.clauses.length} Clauses`}</TransactionClausesLink>,
    status: <TxStatus status={tx.reverted ? 'reverted' : 'success'} />,
  }))

  return (
    <Stack>
      <Title>Transactions</Title>
      <Subtitle>Block #{block.number.toLocaleString()}</Subtitle>

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
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
    </Stack>
  )
}
