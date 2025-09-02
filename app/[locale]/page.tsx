import { Stack } from '@chakra-ui/react'
import { HeroSection } from './components/HeroSection'
import { LatestBlocksSection } from './components/LatestBlocksSection'
import { Stats } from './components/Stats'

export default async function HomePage() {
  return (
    <Stack direction="column" gap={20}>
      <HeroSection />
      <Stats />
      <LatestBlocksSection />
    </Stack>
  )
}
