import { useMemo } from "react"
import { Card, Text } from "@chakra-ui/react"
import { useLatestB3trActions } from "@/hooks/vebetterdao/useLatestB3trActions.ts"

export const ActionsPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { data: actions } = useLatestB3trActions({ numBlocks })

  const actionsPerSec = useMemo(() => {
    if (!actions) {
      return 0
    }

    // Get the difference in time between the first and last block (estimated by num blocks)
    const timeDifference = numBlocks * 10

    // Get the total number of actions
    return actions.length / timeDifference
  }, [actions, numBlocks])

  return (
    <Card.Root>
      <Card.Header>Actions</Card.Header>
      <Card.Body>
        <Text>{actionsPerSec} per second</Text>
        <Card.Description>Last {numBlocks} blocks</Card.Description>
      </Card.Body>
    </Card.Root>
  )
}
