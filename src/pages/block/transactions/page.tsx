import { Navigate, useParams } from "react-router-dom"
import { parseRevision } from "@/utils/revision"
import { useBlock } from "@/services/thor/block/hooks"
import { Revision } from "@vechain/sdk-core"
import { Stack, Table } from "@chakra-ui/react"
import { TransactionClausesLink, TransactionLink } from "@/components/ui/Links"
import { Subtitle, Title } from "@/components/ui/Typography"
import { VnsBadgeOrAddressLink } from "@/components/ui/VnsBadge"
import { PaidGasFees } from "@/components/PaidGasFees"
import { TxStatus } from "@/components/TxStatus"

export const BlockTransactionsPage = () => {
  const { blockId } = useParams<{ blockId: string }>()
  const revision = parseRevision(blockId)

  return revision ? (
    <BlockTransactionList revision={revision} />
  ) : (
    <Navigate to="/404" replace state={{ message: "Invalid block reference" }} />
  )
}

const BlockTransactionList = ({ revision }: { revision: Revision }) => {
  const { data: block, isLoading } = useBlock(revision)

  if (isLoading) return <div>Loading...</div>
  if (!block) return <Navigate to="/404" replace state={{ message: "The block you are looking for does not exist" }} />

  const items = block.transactions.map(tx => ({
    key: tx.id,
    id: <TransactionLink transactionId={tx.id}>{tx.id}</TransactionLink>,
    origin: <VnsBadgeOrAddressLink address={tx.origin} truncateAddress />,
    paid: <PaidGasFees paid={tx.paid} delegator={tx.delegator} />,
    clauses: <TransactionClausesLink transactionId={tx.id}>{tx.clauses.length + " Clauses"}</TransactionClausesLink>,
    status: <TxStatus status={tx.reverted ? "reverted" : "success"} />,
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
