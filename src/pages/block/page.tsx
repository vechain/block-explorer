import { Navigate, useParams } from "react-router-dom"
import { parseRevision } from "@/utils/revision"

import { useBlock } from "@/hooks/thor/useBlock"
import { AddressLink, BlockLink, BlockTransactionsLink } from "@/components/ui/Links"
import { Revision } from "@vechain/sdk-core"
import { Stack, Table } from "@chakra-ui/react"
import { Subtitle, Title } from "@/components/ui/Typography"

export const BlockPage = () => {
  const { blockId } = useParams<{ blockId: string }>()

  const revision = parseRevision(blockId)

  if (!revision) {
    return <Navigate to="/404" replace state={{ message: "Invalid block reference" }} />
  }

  return <BlockDetails revision={revision} />
}

const BlockDetails = ({ revision }: { revision: Revision }) => {
  const { data: block, isLoading } = useBlock(revision)

  if (isLoading) return <div>Loading...</div>
  if (!block) return <Navigate to="/404" replace state={{ message: "The block you are looking for does not exist" }} />

  const items = [
    { name: "ID", value: block.id },
    { name: "Number", value: "#" + block.number },
    { name: "Parent ID", value: <BlockLink blockId={block.parentID}>{block.parentID}</BlockLink> },
    { name: "Timestamp", value: new Date(block.timestamp * 1000).toLocaleString() },
    { name: "Signer", value: <AddressLink address={block.signer} /> },
    {
      name: "Transactions",
      value: <BlockTransactionsLink blockId={block.id}>{block.transactions.length} Transactions</BlockTransactionsLink>,
    },
    { name: "Transactions Root", value: block.txsRoot },
    { name: "Transactions Features", value: block.txsFeatures },
    { name: "State Root", value: block.stateRoot },
    { name: "Size", value: block.size },
    { name: "Gas Limit", value: block.gasLimit },
    { name: "Gas Used", value: block.gasUsed },
    { name: "Beneficiary", value: <AddressLink address={block.beneficiary} /> },
    { name: "Total Score", value: block.totalScore },
    { name: "Receipts Root", value: block.receiptsRoot },
    { name: "Com", value: block.com ? "Yes" : "No" },
    { name: "Is Trunk", value: block.isTrunk ? "Yes" : "No" },
    { name: "Is Finalized", value: block.isFinalized ? "Yes" : "No" },
    {
      name: "Base Fee Per Gas",
      // TODO: fix this 👇
      // @ts-expect-error - baseFeePerGas is not in the type
      value: block.baseFeePerGas.toString(),
    },
  ]

  return (
    <Stack>
      <Title>Block</Title>
      <Subtitle>#{block.number.toLocaleString()}</Subtitle>

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
