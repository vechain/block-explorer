import { Badge, Table } from "@chakra-ui/react"

import { LegacyTransaction as LegacyTransactionType } from "@/services/thor/transaction/actions"
import { TransactionReceipt } from "@vechain/sdk-network"
import { useBaseTransactionItems } from "../hooks/useBaseTransactionItems"

export const LegacyTransaction = ({
  tx,
  receipt,
}: {
  tx: LegacyTransactionType
  receipt: TransactionReceipt | undefined
}) => {
  const baseItems = useBaseTransactionItems(tx, receipt)

  const items = [
    baseItems.id,
    baseItems.status,
    baseItems.blockNumber,
    baseItems.blockId,
    baseItems.timestamp,
    baseItems.size,
    baseItems.origin,
    baseItems.clauses,
    baseItems.chainTag,
    baseItems.blockRef,
    baseItems.expiration,
    baseItems.nonce,
    baseItems.dependsOn,
    baseItems.reward,
    {
      name: "Type",
      value: (
        <Badge variant="surface" size="sm" colorPalette="yellow">
          Legacy
        </Badge>
      ),
    },
    baseItems.gasUsed,
    baseItems.gasFees,
    {
      name: "Gas Price Coef",
      value: tx.gasPriceCoef.toString(),
    },
  ]

  return (
    <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Body>
          {items.map(item => (
            <Table.Row key={item.name}>
              <Table.Cell w="200px">{item.name}</Table.Cell>
              <Table.Cell>{item.value}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
