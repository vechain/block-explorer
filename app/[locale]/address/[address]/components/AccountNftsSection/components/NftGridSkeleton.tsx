import { Grid } from '@chakra-ui/react'
import { NftCardSkeleton } from './NftCardSkeleton'

interface NftGridSkeletonProps {
  count: number
}

export const NftGridSkeleton = ({ count }: NftGridSkeletonProps) => (
  <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
    {Array.from({ length: count }).map((_, i) => (
      <NftCardSkeleton key={i} />
    ))}
  </Grid>
)
