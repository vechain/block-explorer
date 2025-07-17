import { Navigate, useParams } from "react-router-dom"
import { parseHex } from "@/utils/hex"
import { useTransaction } from "@/hooks/thor/useTransaction"
import { Hex } from "@vechain/sdk-core"
import { Stack, Table } from "@chakra-ui/react"
import { AddressLink, BlockLink, TransactionClausesLink, TransactionLink } from "@/components/ui/Links"
import { Subtitle, Title } from "@/components/ui/Typography"
import { formatDateFromTimestamp } from "@/utils/date"

export const TransactionPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>()

  const id = parseHex(transactionId)

  if (!id) {
    return <Navigate to="/404" replace state={{ message: "Invalid transaction id" }} />
  }

  return <TransactionDetails id={id} />
}

const TransactionDetails = ({ id }: { id: Hex }) => {
  const { data: transaction, isLoading } = useTransaction(id)

  if (isLoading) return <div>Loading...</div>
  if (!transaction)
    return <Navigate to="/404" replace state={{ message: "The transaction you are looking for does not exist" }} />

  const items = [
    {
      name: "ID",
      value: transaction.id,
    },
    {
      name: "Block Number",
      value: <BlockLink blockId={transaction.meta.blockID}>#{transaction.meta.blockNumber}</BlockLink>,
    },
    {
      name: "Block ID",
      value: <BlockLink blockId={transaction.meta.blockID}>{transaction.meta.blockID}</BlockLink>,
    },
    {
      name: "Timestamp",
      value: formatDateFromTimestamp(transaction.meta.blockTimestamp),
    },
    {
      name: "Origin",
      value: <AddressLink address={transaction.origin} />,
    },
    {
      name: "Delegator",
      value: transaction.delegator ? <AddressLink address={transaction.delegator} /> : "None",
    },
    {
      name: "Clauses",
      value: (
        <TransactionClausesLink transactionId={transaction.id}>
          {transaction.clauses.length} Clauses
        </TransactionClausesLink>
      ),
    },

    {
      name: "Type",
      // TODO: fix this 👇
      // @ts-expect-error - baseFeePerGas is not in the type
      value: transaction.type.toString(),
    },
    {
      name: "Chain Tag",
      value: transaction.chainTag.toString(),
    },
    {
      name: "Block Ref",
      value: transaction.blockRef,
    },
    {
      name: "Expiration",
      value: transaction.expiration.toString(),
    },
    {
      name: "Gas",
      value: transaction.gas,
    },
    {
      name: "Max Fee Per Gas",
      // TODO: fix this 👇
      // @ts-expect-error - baseFeePerGas is not in the type
      value: transaction.maxFeePerGas,
    },
    {
      name: "Max Priority Fee Per Gas",
      // TODO: fix this 👇
      // @ts-expect-error - baseFeePerGas is not in the type
      value: transaction.maxPriorityFeePerGas,
    },
    {
      name: "Nonce",
      value: transaction.nonce,
    },
    {
      name: "Depends On",
      value: transaction.dependsOn ? (
        <TransactionLink transactionId={transaction.dependsOn}>{transaction.dependsOn}</TransactionLink>
      ) : (
        "None"
      ),
    },
    { name: "Size", value: transaction.size.toString() },
  ]

  return (
    <Stack>
      <Title>Transaction details</Title>
      <Subtitle>{transaction.id.toString()}</Subtitle>

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
