import { useMemo } from "react"
import { Card, Text } from "@chakra-ui/react"
import { useB3trRewardDistributedEvents } from "@/hooks/thor/useB3trRewardDistributedEvents"

export const ActionsPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { data: actions } = useB3trRewardDistributedEvents({ numBlocks })

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
