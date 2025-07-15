import { LatestBlocks } from "@/components/blocks/LatestBlocks.tsx"
import { Flex } from "@chakra-ui/react"
import { ClausesPerSecond } from "@/components/transactions/ClausesPerSecond.tsx"
import { TransactionsPerSecond } from "@/components/transactions/TransactionsPerSecond.tsx"
import { LastBlock } from "@/components/blocks/LastBlock.tsx"
import { ActionsPerSecond } from "@/components/vebetterdao/ActionsPerSecond.tsx"
import { BlockchainInsightsComponent } from "@/components/blockchainInsight/BlockchainInsight"

export const Dashboard = () => {
  return (
    <Flex w={"100%"} direction="column" align="center" mt={-36}>
      <BlockchainInsightsComponent />
      <TransactionsPerSecond numBlocks={10} />
      <ClausesPerSecond numBlocks={10} />
      <ActionsPerSecond numBlocks={10} />
      <LastBlock />
      <LatestBlocks count={5} />
    </Flex>
  )
}
