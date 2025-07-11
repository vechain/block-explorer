import { LatestBlocks } from "@/components/blocks/LatestBlocks.tsx"

import { ClausesPerSecond } from "@/components/transactions/ClausesPerSecond.tsx"
import { TransactionsPerSecond } from "@/components/transactions/TransactionsPerSecond.tsx"
import { LastBlock } from "@/components/blocks/LastBlock.tsx"
import { ActionsPerSecond } from "@/components/vebetterdao/ActionsPerSecond.tsx"
import { HeroSection } from "@/pages/dashboard/components/HeroSection"

export const DashboardPage = () => {
  return (
    <>
      <HeroSection />
      <TransactionsPerSecond numBlocks={10} />
      <ClausesPerSecond numBlocks={10} />
      <ActionsPerSecond numBlocks={10} />
      <LastBlock />
      <LatestBlocks count={5} />
    </>
  )
}
