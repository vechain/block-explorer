import { Card, List, ListItem, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"

import { useBlock } from "@/hooks/thor/useBlock"
import { Revision } from "@vechain/sdk-core"

export const BlockDetails = ({ revision }: { revision: Revision }) => {
  const { data: block, isLoading } = useBlock(revision)
  const navigate = useNavigate()

  if (isLoading) return <div>Loading...</div>
  if (!block) return <div>Block not found</div>

  const handleTransactionClick = (transactionId: string) => {
    navigate(`/transaction/${transactionId}`)
  }

  const handleAddressClick = (address: string) => {
    navigate(`/account/${address}`)
  }

  return (
    <Card.Root>
      <Card.Header>{block.id}</Card.Header>
      <Card.Body>
        <Text>No: {block.number.toLocaleString()}</Text>
        <Text>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</Text>
        <Text onClick={() => handleAddressClick(block.signer)} style={{ cursor: "pointer" }}>
          Signer: {block.signer}
        </Text>
        <Text>Finalised: {block.isFinalized ? "Yes" : "No"}</Text>

        <List.Root>
          {block.transactions.map(tx => (
            <ListItem key={tx.id} onClick={() => handleTransactionClick(tx.id)} style={{ cursor: "pointer" }}>
              {tx.id}
            </ListItem>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  )
}
