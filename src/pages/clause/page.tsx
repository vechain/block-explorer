import { Navigate, useParams } from "react-router-dom"
import { parseHex } from "@/utils/hex"
import { useTransaction } from "@/services/thor/transaction/hooks"
import { Hex } from "@vechain/sdk-core"
import { Stack, Code, Table } from "@chakra-ui/react"
import { AddressLink, TransactionLink } from "@/components/ui/Links"
import { Subtitle, Title } from "@/components/ui/Typography"

export const ClauseDetailsPage = () => {
  const { transactionId, clauseIndex } = useParams<{ transactionId: string; clauseIndex: string }>()

  const id = parseHex(transactionId)
  const index = parseInt(clauseIndex ?? "0")

  if (!id) {
    return <Navigate to="/404" replace state={{ message: "Invalid transaction id" }} />
  }

  return <ClauseDetails transactionId={id} clauseIndex={index} />
}

const ClauseDetails = ({ transactionId, clauseIndex }: { transactionId: Hex; clauseIndex: number }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId)

  if (isLoading) return <div>Loading...</div>
  if (!transaction)
    return <Navigate to="/404" replace state={{ message: "The transaction you are looking for does not exist" }} />

  const clause = transaction.clauses[clauseIndex]

  const items = [
    { name: "Index", value: "#" + clauseIndex.toLocaleString() },
    {
      name: "Transaction",
      value: <TransactionLink transactionId={transactionId.toString()}>{transactionId.toString()}</TransactionLink>,
    },
    { name: "To", value: clause.to ? <AddressLink address={clause.to} /> : "N/A" },
    { name: "Value", value: clause.value.toString() },
    {
      name: "Data",
      value: (
        <Code p={4} whiteSpace="normal" wordBreak="break-all">
          {clause.data}
        </Code>
      ),
    },
  ]

  return (
    <Stack>
      <Title>Clause details</Title>
      <Subtitle>
        Clause #{clauseIndex.toLocaleString()} of transaction {transactionId.toString()}
      </Subtitle>

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
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
    </Stack>
  )
}
