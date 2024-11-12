import { Card, Text } from "@chakra-ui/react"
import "./App.css"
import { HStack } from "@chakra-ui/react"
import { useLatestBlock } from "./hooks/useLatestBlock"

function App() {
  const block = useLatestBlock()

  return (
    <HStack>
      <Card.Root>
        <Card.Header>Latest Block</Card.Header>
        <Card.Body>
          <Text>Number: {block?.number}</Text>
          <Text>ID: {block?.id}</Text>
        </Card.Body>
      </Card.Root>
    </HStack>
  )
}

export default App
