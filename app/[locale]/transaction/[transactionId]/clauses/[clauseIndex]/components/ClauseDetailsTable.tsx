import { Table } from '@chakra-ui/react'
import { TransactionLink } from '@/components/ui-legacy/Links'
import { VETBalance } from '@/components/ui-legacy/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { Clause, TransactionId } from '@/lib/schemas'
import { InputData } from './InputData'
import { useTranslation } from 'react-i18next'

export const ClauseDetailsTable = ({
  clause,
  txId,
  clauseIndex,
}: {
  clause: Clause
  txId: TransactionId
  clauseIndex: number
}) => {
  const { t } = useTranslation()
  const items = [
    {
      name: t('Transaction'),
      value: <TransactionLink transactionId={txId}>{txId}</TransactionLink>,
    },
    { name: t('Index'), value: `# ${clauseIndex.toLocaleString()}` },
    { name: t('To'), value: clause.to ? <VnsBadgeOrAddressLink address={clause.to} /> : 'N/A' },
    { name: t('Value'), value: <VETBalance balance={clause.value} /> },
    { name: t('Input data'), value: <InputData rawData={clause.data} /> },
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
