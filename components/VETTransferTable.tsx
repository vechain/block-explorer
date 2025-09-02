import { Table } from '@chakra-ui/react'
import type { Transfer } from '@vechain/sdk-network'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { VETBalance } from '@/components/ui/TokenBalance'
import { addressStringSchema, hexStringSchema } from '@/lib/schemas'
import { VnsBadgeOrAddressLink } from './ui/VnsBadge'

export const VETTransferTable = ({ transfers }: { transfers: Transfer[] }) => {
  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="bg.subtle">
            <Table.ColumnHeader>From</Table.ColumnHeader>
            <Table.ColumnHeader>To</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <ErrorBoundary>
            {transfers.map((transfer, i) => (
              <Table.Row key={[i, '-', transfer.recipient].join('')}>
                <Table.Cell>
                  <VnsBadgeOrAddressLink address={addressStringSchema.parse(transfer.sender)} />
                </Table.Cell>
                <Table.Cell>
                  <VnsBadgeOrAddressLink address={addressStringSchema.parse(transfer.recipient)} />
                </Table.Cell>
                <Table.Cell>
                  <VETBalance balance={hexStringSchema.parse(transfer.amount)} />
                </Table.Cell>
              </Table.Row>
            ))}
          </ErrorBoundary>
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
