import { Card, List, ListItem, Text } from "@chakra-ui/react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { useNavigate } from "react-router-dom"

export const BlockDetails = ({ block }: { block: ExpandedBlockDetail }) => {
  const navigate = useNavigate()

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
          {block.transactions?.map(tx => (
            <ListItem key={tx.id} onClick={() => handleTransactionClick(tx.id)} style={{ cursor: "pointer" }}>
              {tx.id}
            </ListItem>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  )
}
