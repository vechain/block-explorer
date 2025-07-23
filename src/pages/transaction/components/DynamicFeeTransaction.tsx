import { Badge, Table } from "@chakra-ui/react"
import { formatHexToGwei } from "@/utils/units"
import { TransactionReceipt } from "@vechain/sdk-network"
import { DynamicFeeTransaction as DynamicFeeTransactionType } from "@/services/thor/transaction/actions"
import { useBaseTransactionItems } from "../hooks/useBaseTransactionItems"

export const DynamicFeeTransaction = ({
  tx,
  receipt,
}: {
  tx: DynamicFeeTransactionType
  receipt: TransactionReceipt
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
        <Badge variant="surface" size="sm">
          Dynamic fee
        </Badge>
      ),
    },
    baseItems.gasUsed,
    baseItems.gasFees,
    {
      name: "Max Fee Per Gas",
      value: formatHexToGwei(tx.maxFeePerGas) + " Gwei",
    },
    {
      name: "Max Priority Fee Per Gas",
      value: formatHexToGwei(tx.maxPriorityFeePerGas) + " Gwei",
    },
  ]

  return (
    <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
      <Table.Root size="md">
        <Table.Body>
          {items.map(item => (
            <Table.Row key={item.name}>
              <Table.Cell maxW="200px">{item.name}</Table.Cell>
              <Table.Cell>{item.value}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
