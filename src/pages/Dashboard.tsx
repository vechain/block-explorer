import { LatestBlocks } from "@/components/blocks/LatestBlocks.tsx"
import { HStack, VStack } from "@chakra-ui/react"
import { ClausesPerSecond } from "@/components/transactions/ClausesPerSecond.tsx"
import { TransactionsPerSecond } from "@/components/transactions/TransactionsPerSecond.tsx"
import LastBlock from "@/components/blocks/LastBlock.tsx"
import { ActionsPerSecond } from "@/components/vebetterdao/ActionsPerSecond.tsx"

const Dashboard = () => {
  return (
    <VStack>
      <HStack>
        <TransactionsPerSecond numBlocks={10} />
        <ClausesPerSecond numBlocks={10} />
        <ActionsPerSecond numBlocks={10} />
        <LastBlock />
      </HStack>
      <LatestBlocks count={5} />
    </VStack>
  )
}

export default Dashboard
