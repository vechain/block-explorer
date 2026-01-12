'use client'

import { Box, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { formatEther } from 'viem'
import { useTotalVetStaked, useTotalVetStakedHistoric } from '@/services/veworld-indexer/hooks'
import { TotalVetStakedRange } from '@/services/veworld-indexer/total-vet-staked-historic'
import { Card } from '@/components/ui/Card'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { useFormatAbbreviated, useFormatAmount, useFormatDate } from '@/hooks/useFormatting'

const chartHeight = 140

type DataPoint = {
  timestamp: number
  value: bigint
  formattedValue: number
}

export const TotalStakedChart = () => {
  const { t } = useTranslation()
  const formatAbbreviated = useFormatAbbreviated()
  const [selectedRange, setSelectedRange] = useState<TotalVetStakedRange>(TotalVetStakedRange.DAY)
  const { data: historicData, isLoading } = useTotalVetStakedHistoric(selectedRange)
  const { data: currentTotal } = useTotalVetStaked()

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

  const rangeOptions: ToggleOption<TotalVetStakedRange>[] = [
    { value: TotalVetStakedRange.DAY, label: t('1D') },
    { value: TotalVetStakedRange.MONTH, label: t('1M') },
    { value: TotalVetStakedRange.YEAR, label: t('1Y') },
  ]

  if (isLoading) return <Skeleton height="274px" width="415px" rounded="md" />

  return (
    <Card width="415px" height="274px">
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="bodyL">
          {t('Total Staked')}
        </Heading>

        <ToggleGroup
          options={rangeOptions}
          value={selectedRange}
          onChange={setSelectedRange}
          layoutId="total-staked-range"
          size="sm"
        />
      </Flex>

      <Text textStyle="displayS" color="accent-primary">
        {formatAbbreviated(displayValue)} VET
      </Text>

      <TotalStakedChartVisualization data={chartData} />
    </Card>
  )
}

const TotalStakedChartVisualization = memo(({ data }: { data: DataPoint[] }) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const formatDate = useFormatDate()

  // Calculate Y-axis domain to show more variation
  const values = data.map(d => d.formattedValue)
  const minValue = values.length > 0 ? Math.min(...values) : 0
  const maxValue = values.length > 0 ? Math.max(...values) : 0
  const range = maxValue - minValue

  const padding = range > 0 ? range * 0.05 : maxValue * 0.01
  const domainMin = Math.max(0, minValue - padding)
  const domainMax = maxValue + padding

  const renderTooltip = useCallback(
    ({ active, payload }: TooltipContentProps<number, string>) => {
      if (!active || !payload || payload.length === 0) return null

      const dataPoint = payload[0].payload as DataPoint
      const [formattedVetAmount] = formatAmount({ amount: dataPoint.value })

      return (
        <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
          <Flex alignItems="center" gap={2}>
            <Text textStyle="bodyMSemibold">{t('Date & Time')}:</Text>
            <Text textStyle="bodyM">{formatDate(dataPoint.timestamp)}</Text>
          </Flex>

          <Flex alignItems="center" gap={2}>
            <Text textStyle="bodyMSemibold">{t('Total Staked')}:</Text>
            <Text textStyle="bodyM">{formattedVetAmount} VET</Text>
          </Flex>
        </Stack>
      )
    },
    [t, formatAmount, formatDate],
  )

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
          }}
        >
          <XAxis dataKey="timestamp" hide={true} />
          <YAxis dataKey="formattedValue" domain={[domainMin, domainMax]} hide={true} />

          <Tooltip contentStyle={{ fontSize: '.8rem' }} content={renderTooltip} />
          <Area
            type="monotone"
            dataKey="formattedValue"
            stroke="var(--chakra-colors-accent-primary)"
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
