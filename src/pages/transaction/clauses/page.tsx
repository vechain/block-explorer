import { Navigate, useParams } from "react-router-dom"
import { parseHex } from "@/utils/hex"
import { Hex } from "@vechain/sdk-core"
import { Stack, Table } from "@chakra-ui/react"
import { useTransaction } from "@/services/thor/transaction/hooks"
import { AddressLink, ClauseLink } from "@/components/ui/Links"
import { Subtitle, Title } from "@/components/ui/Typography"

export const TransactionClausesPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>()

  const id = parseHex(transactionId)

  return id ? (
    <TransactionClauseList id={id} />
  ) : (
    <Navigate to="/404" replace state={{ message: "Invalid transaction id" }} />
  )
}

const TransactionClauseList = ({ id }: { id: Hex }) => {
  const { data: transaction, isLoading } = useTransaction(id)

  if (isLoading) return <div>Loading...</div>
  if (!transaction)
    return <Navigate to="/404" replace state={{ message: "The transaction you are looking for does not exist" }} />

  const items = transaction.clauses.map((clause, index) => ({
    index,
    to: clause.to ? <AddressLink address={clause.to} /> : "N/A",
    value: clause.value.toString(),
    data: clause.data,
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
