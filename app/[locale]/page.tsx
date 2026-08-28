import { VStack } from '@chakra-ui/react'
import { Suspense } from 'react'
import { HomeStatsGroup } from '@/components/ui/HomeStatsGroup'
import { TableSkeleton } from '@/components/ui/Table'
import { ActivitySection } from './components/ActivitySection'
import { PriceCards } from './components/PriceCards'
import { TransfersSection } from './components/TransfersSection'

// No server prefetch on purpose: every child renders client-only and refetches on mount.
export default function HomePage() {
  return (
    <VStack gap={8} alignItems="stretch">
      <Suspense fallback={<TableSkeleton />}>
        <HomeStatsGroup />
      </Suspense>
      <PriceCards />
      <Suspense fallback={<TableSkeleton />}>
        <ActivitySection />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <TransfersSection />
      </Suspense>
    </VStack>
  )
}
