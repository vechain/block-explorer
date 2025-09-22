'use client'

import { Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import type { BarRectangleItem } from 'recharts/types/cartesian/Bar'
import { timeFormat } from '@/lib/utils/date'
import { useLatestBlocks } from '@/services/thor/hooks'

const width = 1000
const height = 400

const MAX_BLOCKS_COUNT = 100

type DataPoint = {
  id: string
  gasLimit: number
  gasUsed: number
  number: number
  timestamp: number
}

export const BlockUsage = () => {
  const { blocksDataPoints, isPending } = useBlockUsageChartData()

  if (isPending) return <Skeleton height={height} width={width} rounded="xl" />

  return (
    <Stack flex={1} gap={4} bg="bg.muted" rounded="xl" p={8}>
      <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
        Block Usage
      </Heading>

      <BlockUsageChart data={blocksDataPoints} />
    </Stack>
  )
}

const BlockUsageChart = ({ data }: { data: DataPoint[] }) => {
  const router = useRouter()

  const handleBarClick = (dataPoint: BarRectangleItem) => {
    router.push(`/block/${dataPoint.id}`)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart width={width} height={height} data={data}>
        <GreenToRedGradient />
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          interval={10}
          textAnchor="start"
          tickLine={false}
          tickFormatter={timeFormat}
          tick={{ style: { fontSize: '.7rem' } }}
        />
        <YAxis
          unit="M"
          dataKey="gasLimit"
          tickFormatter={value => (Number(value) / 10 ** 6).toLocaleString()}
          tick={{ style: { fontSize: '.8rem' } }}
        />

        <Tooltip contentStyle={{ fontSize: '.8rem' }} content={CustomTooltip} />
        <Bar dataKey="gasUsed" fill="url(#greenToRed)" onClick={handleBarClick} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const CustomTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
  const isVisible = active && payload.length > 0

  if (!isVisible) return null

  const dataPoint = payload[0].payload as DataPoint

  return (
    <Stack bg="bg" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          Block Number:
        </Text>
        <Text fontSize="sm">{dataPoint.number.toLocaleString()}</Text>
      </Flex>

      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          Gas Used:
        </Text>
        <Text fontSize="sm">{dataPoint.gasUsed.toLocaleString()}</Text>
      </Flex>

      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          Gas Limit:
        </Text>
        <Text fontSize="sm">{dataPoint.gasLimit.toLocaleString()}</Text>
      </Flex>

      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          Usage:
        </Text>
        <Text fontSize="sm">{((dataPoint.gasUsed / dataPoint.gasLimit) * 100).toFixed(2)}%</Text>
      </Flex>
    </Stack>
  )
}

const GreenToRedGradient = () => {
  return (
    <defs>
      <linearGradient id="greenToRed" x1="0" x2="0" y1="0" y2="90%" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ff0000" />
        <stop offset="25%" stopColor="#ff9900" />
        <stop offset="50%" stopColor="#ffff00" />
        <stop offset="75%" stopColor="#80ff00" />
        <stop offset="100%" stopColor="#33cc33" />
      </linearGradient>
    </defs>
  )
}

const useBlockUsageChartData = () => {
  const { data = [], ...rest } = useLatestBlocks({ count: MAX_BLOCKS_COUNT })
  const blocksDataPoints = data
    .reverse()
    .map(({ id, gasUsed, gasLimit, number, timestamp }) => ({ id, gasUsed, gasLimit, number, timestamp }))

  return { blocksDataPoints, ...rest }
}
