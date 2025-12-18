'use client'

import { Stack, Table } from '@chakra-ui/react'
import { notFound } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Code } from '@/components/ui-legacy/Code'
import { ClauseLink } from '@/components/ui-legacy/Links'
import { VETBalance } from '@/components/ui-legacy/TokenBalance'
import { Subtitle, Title } from '@/components/ui-legacy/Typography'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { TransactionId } from '@/lib/schemas'
import { useTransaction } from '@/services/thor/hooks'

export const TransactionClauseList = ({ transactionId }: { transactionId: TransactionId }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId)
  const { t } = useTranslation()

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
      <Title>{t('Clauses')}</Title>
      <Subtitle>
        {t('Transaction')} {transaction.id}
      </Subtitle>

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>{t('Index')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('To')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('Value')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('Data')}</Table.ColumnHeader>
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
