'use client'

import { Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { formatEther } from 'viem'
import { useNftHolders, useTotalVetStaked, useTotalVthoClaimed } from '@/services/veworld-indexer/hooks'

const prettifyAmount = (amount: bigint = 0n) => {
  const amountString = formatEther(amount)
  const [intPart] = amountString.split('.')
  return Number(intPart).toLocaleString()
}

export const Stats = () => {
  const { data: totalVthoClaimed, isPending: isTotalVthoClaimedPending } = useTotalVthoClaimed()
  const { data: totalVetStaked, isPending: isTotalVetStakedPending } = useTotalVetStaked()
  const { data: nftHolders, isPending: isNftHoldersPending } = useNftHolders()

  return (
    <Stack gap={10}>
      <StatCard title="NFT Holders" value={nftHolders?.total.toLocaleString() ?? '0'} isPending={isNftHoldersPending} />
      <StatCard
        title="Total VET Staked"
        value={prettifyAmount(totalVetStaked?.total)}
        isPending={isTotalVetStakedPending}
      />
      <StatCard
        title="Total VTHO Claimed"
        value={prettifyAmount(totalVthoClaimed)}
        isPending={isTotalVthoClaimedPending}
      />
    </Stack>
  )
}

const height = '120px'
const width = '320px'

const StatCard = ({ title, value, isPending }: { title: string; value: string; isPending: boolean }) => {
  if (isPending) return <Skeleton height={height} width={width} rounded="md" />

  return (
    <Stack bg="bg.muted" p={6} rounded="md" height={height} width={width} justifyContent="space-between">
      <Heading as="h4" size="sm" color="fg.muted">
        {title}
      </Heading>
      <Text fontSize="2xl" fontWeight={600}>
        {value}
      </Text>
    </Stack>
  )
}
