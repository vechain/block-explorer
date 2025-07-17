import { Navigate, useParams } from "react-router-dom"
import { parseRevision } from "@/utils/revision"
import { useBlock } from "@/hooks/thor/useBlock"
import { Hex, Revision } from "@vechain/sdk-core"
import { Stack, Badge, Table } from "@chakra-ui/react"
import { AddressLink, TransactionClausesLink, TransactionLink } from "@/components/ui/Links"
import { Subtitle, Title } from "@/components/ui/Typography"
import { formatEther } from "viem"

export const BlockTransactionsPage = () => {
  const { blockId } = useParams<{ blockId: string }>()

  const revision = parseRevision(blockId)

  if (!revision) {
    return <Navigate to="/404" replace state={{ message: "Invalid block reference" }} />
  }

  return <BlockTransactionList revision={revision} />
}

const BlockTransactionList = ({ revision }: { revision: Revision }) => {
  const { data: block, isLoading } = useBlock(revision)

  if (isLoading) return <div>Loading...</div>
  if (!block) return <Navigate to="/404" replace state={{ message: "The block you are looking for does not exist" }} />

  const items = block.transactions.map(tx => ({
    key: tx.id,
    id: <TransactionLink transactionId={tx.id}>{tx.id}</TransactionLink>,
    origin: <AddressLink address={tx.origin} />,
    delegator: tx.delegator && <AddressLink address={tx.delegator} />,
    clauses: <TransactionClausesLink transactionId={tx.id}>{tx.clauses.length + " Clauses"}</TransactionClausesLink>,
    paid: formatEther(Hex.of(tx.paid).bi),
    status: tx.reverted ? <Badge colorPalette="red">Reverted</Badge> : <Badge colorPalette="green">Success</Badge>,
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
              <Table.ColumnHeader>Origin</Table.ColumnHeader>
              <Table.ColumnHeader>Delegator</Table.ColumnHeader>
              <Table.ColumnHeader>Clauses</Table.ColumnHeader>
              <Table.ColumnHeader>Paid</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {items.map(item => (
              <Table.Row key={item.key}>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.id}
                </Table.Cell>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.origin}
                </Table.Cell>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.delegator}
                </Table.Cell>
                <Table.Cell maxW="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {item.clauses}
                </Table.Cell>
                <Table.Cell>{item.paid}</Table.Cell>
                <Table.Cell>{item.status}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  )
}
