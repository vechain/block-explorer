import { Table } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { VETBalance } from '@/components/ui-legacy/TokenBalance'
import type { Transfer } from '@/lib/schemas'
import { VnsBadgeOrAddressLink } from './ui-legacy/VnsBadge'

export const VETTransferTable = ({ transfers }: { transfers: Transfer[] }) => {
  const { t } = useTranslation()
  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader>{t('From')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('To')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('Amount')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <ErrorBoundary>
            {transfers.map((transfer, i) => (
              <Table.Row key={[i, '-', transfer.recipient].join('')}>
                <Table.Cell>
                  <VnsBadgeOrAddressLink address={transfer.sender} />
                </Table.Cell>
                <Table.Cell>
                  <VnsBadgeOrAddressLink address={transfer.recipient} />
                </Table.Cell>
                <Table.Cell>
                  <VETBalance balance={transfer.amount} />
                </Table.Cell>
              </Table.Row>
            ))}
          </ErrorBoundary>
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
