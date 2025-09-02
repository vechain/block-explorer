'use client'

import { Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { formatEther } from 'viem'
import { useNftHolders, useTotalVetStaked, useTotalVthoClaimed } from '@/services/veworld-indexer/hooks'

export const Stats = () => {
  const { data: totalVthoClaimed } = useTotalVthoClaimed()
  const { data: totalVetStaked } = useTotalVetStaked()
  const { data: nftHolders } = useNftHolders()

  return (
    <Stack gap={10}>
      <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
        Stats
      </Heading>

      <Flex gap={4} width="100%">
        <StatCard title="Total VTHO Claimed" value={formatEther(totalVthoClaimed ?? 0n)} />
        <StatCard title="Total VET Staked" value={formatEther(totalVetStaked?.total ?? 0n)} />
        <StatCard title="NFT Holders" value={nftHolders?.total.toLocaleString() ?? '0'} />
      </Flex>
    </Stack>
  )
}

const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <Stack bg="bg.muted" p={4} rounded="md" width="100%">
      <Heading as="h4" size="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">
        {title}
      </Heading>
      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
    </Stack>
  )
}
