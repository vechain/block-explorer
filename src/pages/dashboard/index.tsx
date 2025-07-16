import { HeroSection } from "@/pages/dashboard/components/HeroSection.tsx"
import { LatestBlocksSection } from "@/pages/dashboard/components/LatestBlocksSection"
import { Stack } from "@chakra-ui/react"

export const DashboardPage = () => {
  return (
    <>
      <HeroSection />

      <Stack py={20} px={10} gap={20}>
        <LatestBlocksSection />
      </Stack>
    </>
  )
}
