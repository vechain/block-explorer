'use client'

import { Heading, Stack, Text } from '@chakra-ui/react'
import { formatEther } from 'viem'
import { useNftHolders, useTotalVetStaked, useTotalVthoClaimed } from '@/services/veworld-indexer/hooks'

const prettifyAmount = (amount: bigint = 0n) => {
  const amountString = formatEther(amount)
  const [intPart] = amountString.split('.')
  return Number(intPart).toLocaleString()
}

export const Stats = () => {
  const { data: totalVthoClaimed } = useTotalVthoClaimed()
  const { data: totalVetStaked } = useTotalVetStaked()
  const { data: nftHolders } = useNftHolders()

  return (
    <Stack gap={10}>
      <StatCard title="Total VTHO Claimed" value={prettifyAmount(totalVthoClaimed)} />
      <StatCard title="Total VET Staked" value={prettifyAmount(totalVetStaked?.total)} />
      <StatCard title="NFT Holders" value={nftHolders?.total.toLocaleString() ?? '0'} />
    </Stack>
  )
}

const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <Stack bg="bg.muted" p={6} rounded="md" height="120px" width="320px" justifyContent="space-between">
      <Heading as="h4" size="sm" color="fg.muted">
        {title}
      </Heading>
      <Text fontSize="2xl" fontWeight={600}>
        {value}
      </Text>
    </Stack>
  )
}
