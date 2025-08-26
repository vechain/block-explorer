import { useAccountTransactions } from "@/services/veworld-indexer/transactions/hooks"

import { Stack, Table } from "@chakra-ui/react"
import { BlockLink, TransactionClausesLink, TransactionLink } from "@/components/ui/Links"

import { VnsBadgeOrAddressLink } from "@/components/ui/VnsBadge"
import { PaidGasFees } from "@/components/PaidGasFees"
import { TxStatus } from "@/components/TxStatus"
import { useState } from "react"
import { formatDateFromTimestamp } from "@/utils/date"
import { Pagination } from "@/components/ui/Pagination"
import { NoTransactions } from "@/components/NoResults"

const PAGE_SIZE = 30

export const AccountTransactionsTab = ({ address }: { address: `0x${string}` }) => {
  const [page, setPage] = useState(0)
  const { data: transactions, isLoading } = useAccountTransactions({
    params: { origin: address, page, size: PAGE_SIZE },
  })

  if (isLoading) return <div>Loading...</div>
  if (!transactions || transactions.data.length === 0) return <NoTransactions />

  const items = transactions.data.map(tx => ({
    key: tx.id,
    id: <TransactionLink transactionId={tx.id}>{tx.id}</TransactionLink>,
    status: <TxStatus status={tx.reverted ? "reverted" : "success"} />,
    origin: <VnsBadgeOrAddressLink address={tx.origin} truncateAddress />,
    block: <BlockLink blockId={tx.blockId}>{tx.blockNumber}</BlockLink>,
    timestamp: formatDateFromTimestamp(tx.blockTimestamp),
    paid: (
      <PaidGasFees
        paid={tx.paid}
        delegator={tx.gasPayer.toLocaleLowerCase() == address.toLocaleLowerCase() ? undefined : tx.gasPayer}
      />
    ),
    clauses: <TransactionClausesLink transactionId={tx.id}>{tx.clauses.length + " Clauses"}</TransactionClausesLink>,
  }))

  return (
    <Stack>
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

      <Pagination page={page} hasNext={transactions.pagination.hasNext} onPageChange={setPage} />
    </Stack>
  )
}
