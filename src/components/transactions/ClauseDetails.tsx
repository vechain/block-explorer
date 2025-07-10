import { Link as RouterLink } from "react-router-dom"
import { Card, Text, Link as ChakraLink } from "@chakra-ui/react"
import { Hex } from "@vechain/sdk-core"
import { useTransaction } from "@/hooks/thor/useTransaction"

export const ClauseDetails = ({ transactionId, clauseIndex }: { transactionId: Hex; clauseIndex: number }) => {
  const { data: tx, isLoading } = useTransaction(transactionId)

  if (isLoading) return <div>Loading...</div>
  if (!tx) return <div>Transaction not found</div>

  const clause = tx.clauses[clauseIndex]

  return (
    <Card.Root>
      <Card.Header>Clause</Card.Header>
      <Card.Body>
        <Card.Body>
          <ChakraLink asChild>
            <RouterLink to={`/block/${tx.meta.blockID}`}>Block: {tx.meta.blockID}</RouterLink>
          </ChakraLink>
          <ChakraLink asChild>
            <RouterLink to={`/transaction/${tx.id}`}>Tx: {tx.id}</RouterLink>
          </ChakraLink>
          <ChakraLink asChild>
            <RouterLink to={`/account/${tx.origin}`}>Origin: {tx.origin}</RouterLink>
          </ChakraLink>
          {clause.to && (
            <ChakraLink asChild>
              <RouterLink to={`/account/${clause.to}`}>To: {clause.to}</RouterLink>
            </ChakraLink>
          )}
          <Text>Value: {clause.value}</Text>
          <Text>Data: {clause.data}</Text>
        </Card.Body>
      </Card.Body>
    </Card.Root>
  )
}
