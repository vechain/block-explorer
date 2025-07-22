import { HeroSection } from "@/pages/dashboard/components/HeroSection.tsx"
import { LatestBlocksSection } from "@/pages/dashboard/components/LatestBlocksSection"
import { Stack } from "@chakra-ui/react"
import { Stats } from "./components/Stats"

export const DashboardPage = () => {
  return (
    <Stack direction="column" gap={20}>
      <HeroSection />
      <Stats />
      <LatestBlocksSection />
    </Stack>
  )
}
