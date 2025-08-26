import { Stack, Table } from "@chakra-ui/react"
import { TransactionLink } from "@/components/ui/Links"

import { VnsBadgeOrAddressLink } from "@/components/ui/VnsBadge"
import { useState } from "react"
import { Pagination } from "@/components/ui/Pagination"
import { NoTransfers } from "@/components/NoResults"
import { useAccountTransfers } from "@/services/veworld-indexer/transfers/hooks"
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { formatEther } from "viem"

const PAGE_SIZE = 30

export const AccountTransfersTab = ({ address }: { address: `0x${string}` }) => {
  const [page, setPage] = useState(0)
  const { data: transfers, isLoading } = useAccountTransfers({
    params: { address, page, size: PAGE_SIZE },
  })

  if (isLoading) return <div>Loading...</div>
  if (!transfers || transfers.data.length === 0) return <NoTransfers />

  const items = transfers.data.map(transfer => ({
    key: transfer.id,
    txId: <TransactionLink transactionId={transfer.txId}>{transfer.txId}</TransactionLink>,
    from: <VnsBadgeOrAddressLink truncateAddress address={transfer.from} />,
    to: <VnsBadgeOrAddressLink truncateAddress address={transfer.to} />,
    token: transfer.tokenAddress && <VnsBadgeOrAddressLink truncateAddress address={transfer.tokenAddress} />,
    amount: formatEther(transfer.value),
  }))

  return (
    <Stack>
      <Table.ScrollArea borderWidth="1px" rounded="md">
        <Table.Root size="md" borderWidth="1px" rounded="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>Tx ID</Table.ColumnHeader>
              <Table.ColumnHeader>From</Table.ColumnHeader>
              <Table.ColumnHeader>To</Table.ColumnHeader>
              <Table.ColumnHeader>Token</Table.ColumnHeader>
              <Table.ColumnHeader>Amount</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <ErrorBoundary>
              {items.map(item => (
                <Table.Row key={item.key}>
                  <Table.Cell maxW="150px">{item.txId}</Table.Cell>
                  <Table.Cell>{item.from}</Table.Cell>
                  <Table.Cell>{item.to}</Table.Cell>
                  <Table.Cell>{item.token || "-"}</Table.Cell>
                  <Table.Cell>{item.amount}</Table.Cell>
                </Table.Row>
              ))}
            </ErrorBoundary>
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination page={page} hasNext={transfers.pagination.hasNext} onPageChange={setPage} />
    </Stack>
  )
}
