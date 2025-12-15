'use client'

import { Box, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { formatEther } from 'viem'
import { formatAbbreviated, formatAmount } from '@/lib/utils/units'
import { useTotalVetStaked, useTotalVetStakedHistoric } from '@/services/veworld-indexer/hooks'
import { TotalVetStakedRange } from '@/services/veworld-indexer/total-vet-staked-historic'

const chartHeight = 100

type DataPoint = {
  timestamp: number
  value: bigint
  formattedValue: number
}

export const TotalStakedChart = () => {
  const { t } = useTranslation()
  const [selectedRange, setSelectedRange] = useState<TotalVetStakedRange>(TotalVetStakedRange.DAY)
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

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const displayValue = currentTotal?.total ?? (latestValue ? latestValue.value : 0n)

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
      backdropFilter="blur(32px)"
      p={5}>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="bodyL">
          {t('Total Staked')}
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
            bg={selectedRange === TotalVetStakedRange.DAY ? 'white' : 'transparent'}
            color={selectedRange === TotalVetStakedRange.DAY ? 'bg-primary' : 'fg'}
            textStyle="bodySSemibold"
            cursor="pointer"
            onClick={() => setSelectedRange(TotalVetStakedRange.DAY)}
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
            bg={selectedRange === TotalVetStakedRange.MONTH ? 'white' : 'transparent'}
            color={selectedRange === TotalVetStakedRange.MONTH ? 'bg-primary' : 'fg'}
            textStyle="bodySSemibold"
            cursor="pointer"
            onClick={() => setSelectedRange(TotalVetStakedRange.MONTH)}
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
            bg={selectedRange === TotalVetStakedRange.YEAR ? 'white' : 'transparent'}
            color={selectedRange === TotalVetStakedRange.YEAR ? 'bg-primary' : 'fg'}
            textStyle="bodySSemibold"
            cursor="pointer"
            onClick={() => setSelectedRange(TotalVetStakedRange.YEAR)}
            transition="all 0.2s">
            1Y
          </Flex>
        </Flex>
      </Flex>

      <Text textStyle="displayS" color="highlight-primary">
        {formatAbbreviated(displayValue)} VET
      </Text>

      <TotalStakedChartVisualization data={chartData} />

      <Stack>
        <Text textStyle="bodyS" color="text-secondary">
          {t('Circulating Supply')}
        </Text>
        <Text textStyle="bodyMSemibold" color="fg">
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
            stroke="var(--chakra-colors-highlight-primary)"
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
  const { t } = useTranslation()
  const isVisible = active && payload && payload.length > 0

  if (!isVisible) return null

  const dataPoint = payload[0].payload as DataPoint

  const [formatted] = formatAmount({ amount: dataPoint.value })
  const [intPart, decimalPart] = formatted.split('.')
  const formattedInt = Number(intPart).toLocaleString()
  const formattedVetAmount = decimalPart ? `${formattedInt}.${decimalPart}` : formattedInt

  return (
    <Stack bg="bg" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text textStyle="bodyMSemibold">{t('Date & Time')}:</Text>
        <Text textStyle="bodyM">{format(new Date(dataPoint.timestamp), 'MMM d, yyyy h:mm a')}</Text>
      </Flex>

      <Flex alignItems="center" gap={2}>
        <Text textStyle="bodyMSemibold">{t('Total Staked')}:</Text>
        <Text textStyle="bodyM">{formattedVetAmount} VET</Text>
      </Flex>
    </Stack>
  )
}
