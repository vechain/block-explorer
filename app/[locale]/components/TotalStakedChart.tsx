'use client'

import { Box, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { memo, useMemo, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { formatEther } from 'viem'
import { useTotalVetStaked, useTotalVetStakedHistoric } from '@/services/veworld-indexer/hooks'
import type { TotalVetStakedRange } from '@/services/veworld-indexer/total-vet-staked-historic'

const chartHeight = 100

type DataPoint = {
  timestamp: number
  value: bigint
  formattedValue: number
}

export const TotalStakedChart = () => {
  const [selectedRange, setSelectedRange] = useState<TotalVetStakedRange>('1-day')
  const { data: historicData, isLoading } = useTotalVetStakedHistoric(selectedRange)
  const { data: currentTotal } = useTotalVetStaked()

  // Transform API data to chart format - memoized to avoid recalculation
  const chartData: DataPoint[] = useMemo(
    () =>
      historicData?.map((point: { timestamp: number; value: string }) => {
        const value = BigInt(point.value)
        const formattedValue = Number(formatEther(value))
        return {
          timestamp: point.timestamp,
          value,
          formattedValue,
        }
      }) ?? [],
    [historicData],
  )

  // Get the latest value for display - memoized
  const displayValue = useMemo(() => {
    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1] : null
    return currentTotal?.total ?? (latestValue ? latestValue.value : 0n)
  }, [chartData, currentTotal?.total])

  // Format the total staked amount to abbreviated form (e.g., 6B, 6.8B) - memoized
  const formattedValue = useMemo(() => {
    const formatTotalStakedAbbreviated = (amount: bigint) => {
      const amountString = formatEther(amount)
      const [intPart] = amountString.split('.')
      const num = Number(intPart)

      if (num >= 1_000_000_000) {
        const billions = num / 1_000_000_000
        return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`
      }
      if (num >= 1_000_000) {
        const millions = num / 1_000_000
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
      }
      if (num >= 1_000) {
        const thousands = num / 1_000
        return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
      }
      return num.toLocaleString()
    }
    return formatTotalStakedAbbreviated(displayValue)
  }, [displayValue])

  if (isLoading) return <Skeleton height="274px" width="415px" rounded="md" />

  return (
    <Stack
      width="415px"
      height="274px"
      gap={4}
      bg="bg-card-surface-2"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border-surface"
      p={5}>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="bodyL" color="fg" fontWeight="normal">
          Total Staked
        </Heading>

        <Flex
          align="center"
          gap={1}
          bg="bg-surface-alt"
          borderRadius="full"
          borderWidth="0.5px"
          borderColor="border-surface"
          p="4px">
          <Flex
            as="button"
            align="center"
            justify="center"
            px={3}
            py={1}
            borderRadius="full"
            bg={selectedRange === '1-day' ? 'white' : 'transparent'}
            color={selectedRange === '1-day' ? 'bg-primary' : 'fg'}
            fontSize="xs"
            fontWeight="medium"
            cursor="pointer"
            onClick={() => setSelectedRange('1-day')}
            transition="all 0.2s">
            1D
          </Flex>
          <Flex
            as="button"
            align="center"
            justify="center"
            px={3}
            py={1}
            borderRadius="full"
            bg={selectedRange === '1-month' ? 'white' : 'transparent'}
            color={selectedRange === '1-month' ? 'bg-primary' : 'fg'}
            fontSize="xs"
            fontWeight="medium"
            cursor="pointer"
            onClick={() => setSelectedRange('1-month')}
            transition="all 0.2s">
            1M
          </Flex>
          <Flex
            as="button"
            align="center"
            justify="center"
            px={3}
            py={1}
            borderRadius="full"
            bg={selectedRange === '1-year' ? 'white' : 'transparent'}
            color={selectedRange === '1-year' ? 'bg-primary' : 'fg'}
            fontSize="xs"
            fontWeight="medium"
            cursor="pointer"
            onClick={() => setSelectedRange('1-year')}
            transition="all 0.2s">
            1Y
          </Flex>
        </Flex>
      </Flex>

      <Text textStyle="displayS" color="highlight-primary">
        {formattedValue} VET
      </Text>

      <TotalStakedChartVisualization data={chartData} />

      <Stack>
        <Text fontSize="xs" color="text-secondary">
          Circulating Supply
        </Text>
        <Text fontSize="md" fontWeight="semibold" color="fg">
          1521251
        </Text>
      </Stack>
    </Stack>
  )
}

const TotalStakedChartVisualization = memo(({ data }: { data: DataPoint[] }) => {
  // Calculate Y-axis domain to show more variation
  const values = data.map(d => d.formattedValue)
  const minValue = values.length > 0 ? Math.min(...values) : 0
  const maxValue = values.length > 0 ? Math.max(...values) : 0
  const range = maxValue - minValue

  // Add padding (5% of range) above and below to make the chart more readable
  // If range is 0, use a small default padding
  const padding = range > 0 ? range * 0.05 : maxValue * 0.01
  const domainMin = Math.max(0, minValue - padding)
  const domainMax = maxValue + padding

  return (
    <Box height={chartHeight} mb={4}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          height={chartHeight}
          data={data}
          margin={{
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}>
          <XAxis dataKey="timestamp" hide={true} />
          <YAxis dataKey="formattedValue" domain={[domainMin, domainMax]} hide={true} />

          <Tooltip
            contentStyle={{ fontSize: '.8rem' }}
            content={(props: TooltipContentProps<number, string>) => <CustomTooltip {...props} />}
          />
          <Area
            type="monotone"
            dataKey="formattedValue"
            stroke="rgba(184, 166, 255, 1)"
            strokeWidth={2}
            fill="none"
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
})

TotalStakedChartVisualization.displayName = 'TotalStakedChartVisualization'

const CustomTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
  const isVisible = active && payload && payload.length > 0

  if (!isVisible) return null

  const dataPoint = payload[0].payload as DataPoint

  // Format the date and time for the data point
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Format VET amount
  const formatVetAmount = (value: bigint) => {
    const amountString = formatEther(value)
    const [intPart, decimalPart] = amountString.split('.')
    const formattedInt = Number(intPart).toLocaleString()
    const formattedDecimal = decimalPart ? decimalPart.substring(0, 4).replace(/0+$/, '') : ''
    return formattedDecimal ? `${formattedInt}.${formattedDecimal}` : formattedInt
  }

  return (
    <Stack bg="bg" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          Date & Time:
        </Text>
        <Text fontSize="sm">{formatDateTime(dataPoint.timestamp)}</Text>
      </Flex>

      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          Total Staked:
        </Text>
        <Text fontSize="sm">{formatVetAmount(dataPoint.value)} VET</Text>
      </Flex>
    </Stack>
  )
}
