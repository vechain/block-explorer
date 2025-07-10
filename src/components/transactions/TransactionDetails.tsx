import { Link as RouterLink } from "react-router-dom"
import { Card, List, ListItem, Text, Link as ChakraLink } from "@chakra-ui/react"
import { Hex } from "@vechain/sdk-core"
import { useTransaction } from "@/hooks/thor/useTransaction"

export const TransactionDetails = ({ id }: { id: Hex }) => {
  const { data: tx, isLoading } = useTransaction(id)

  if (isLoading) return <div>Loading...</div>
  if (!tx) return <div>Transaction not found</div>

  return (
    <Card.Root>
      <Card.Header>{tx.id}</Card.Header>
      <Card.Body>
        <Text>
          Block:{" "}
          <ChakraLink asChild>
            <RouterLink to={`/block/${tx.meta.blockID}`}>{tx.meta.blockID}</RouterLink>
          </ChakraLink>
        </Text>
        <Text>Gas: {tx.gas.toLocaleString()}</Text>
        <Text>Origin: {tx.origin}</Text>
        <Text>Nonce: {tx.nonce.toLocaleString()}</Text>
        <Text>Size: {tx.size.toLocaleString()}</Text>
        <Text>Clauses:</Text>
        <List.Root>
          {tx.clauses.map((clause, index) => (
            <ListItem key={index} asChild>
              <ChakraLink asChild>
                <RouterLink to={`/transaction/${tx.id}/clause/${index}`}>{clause.to}</RouterLink>
              </ChakraLink>
            </ListItem>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  )
}
