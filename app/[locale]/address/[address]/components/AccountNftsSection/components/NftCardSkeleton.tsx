import { Flex, Skeleton } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'

export const NftCardSkeleton = () => {
  return (
    <Card variant="tertiary" overflow="hidden" gap={3}>
      <Skeleton width="100%" aspectRatio="1/1" />
      <Flex alignItems="center" justifyContent="center">
        <Skeleton height="12px" width="40%" />
      </Flex>
    </Card>
  )
}
