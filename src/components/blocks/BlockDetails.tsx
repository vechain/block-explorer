import { Card, List, ListItem, Text, Link as ChakraLink } from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"

import { useBlock } from "@/hooks/thor/useBlock"
import { Revision } from "@vechain/sdk-core"

export const BlockDetails = ({ revision }: { revision: Revision }) => {
  const { data: block, isLoading } = useBlock(revision)

  if (isLoading) return <div>Loading...</div>
  if (!block) return <div>Block not found</div>

  return (
    <Card.Root>
      <Card.Header>{block.id}</Card.Header>
      <Card.Body>
        <Text>No: {block.number.toLocaleString()}</Text>
        <Text>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</Text>

        <ChakraLink asChild>
          <RouterLink to={`/account/${block.signer}`}>Signer: {block.signer}</RouterLink>
        </ChakraLink>

        <Text>Finalised: {block.isFinalized ? "Yes" : "No"}</Text>

        <List.Root>
          {block.transactions.map(tx => (
            <ListItem asChild key={tx.id}>
              <ChakraLink asChild>
                <RouterLink to={`/transaction/${tx.id}`}>{tx.id}</RouterLink>
              </ChakraLink>
            </ListItem>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  )
}
