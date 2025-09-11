'use client'

import { Stack, Table } from '@chakra-ui/react'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { Code } from '@/components/ui/Code'
import { ClauseLink } from '@/components/ui/Links'
import { VETBalance } from '@/components/ui/TokenBalance'
import { Subtitle, Title } from '@/components/ui/Typography'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import type { HexString } from '@/lib/schemas'
import { useTransaction } from '@/services/thor/hooks'

export default function TransactionClausesPage({ params }: { params: Promise<{ transactionId: HexString }> }) {
  const { transactionId } = use(params)

  if (!transactionId) {
    notFound()
  }

  return <TransactionClauseList transactionId={transactionId} />
}

const TransactionClauseList = ({ transactionId }: { transactionId: HexString }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId)

  if (isLoading) return <div>Loading...</div>
  if (!transaction) {
    notFound()
  }

  const items = transaction.clauses.map((clause, index) => ({
    index,
    to: clause.to ? <VnsBadgeOrAddressLink address={clause.to} /> : 'N/A',
    value: <VETBalance balance={clause.value} />,
    data: <Code>{clause.data}</Code>,
  }))

  return (
    <Stack>
      <Title>Clauses</Title>
      <Subtitle>Transaction {transaction.id.toString()}</Subtitle>

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>Index</Table.ColumnHeader>
              <Table.ColumnHeader>To</Table.ColumnHeader>
              <Table.ColumnHeader>Value</Table.ColumnHeader>
              <Table.ColumnHeader>Data</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {items.map(item => (
              <Table.Row key={item.index}>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  <ClauseLink transactionId={transaction.id} clauseIndex={item.index}>
                    # {item.index.toLocaleString()}
                  </ClauseLink>
                </Table.Cell>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.to}
                </Table.Cell>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.value}
                </Table.Cell>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.data}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  )
}
