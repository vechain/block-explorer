'use client'

import { Box, Flex, HStack, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { getUnixTime } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { BlockUsageData } from '@/lib/schemas'
import { type CumulativeDataPoint, transformBlockUsageCumulativeData } from '@/lib/utils/block-usage'
import { timeFormat } from '@/lib/utils/date'
import { useBlockUsage } from '@/services/veworld-indexer/block-usage'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { TimeRangeHeader } from '@/components/TimeRangeHeader/TimeRangeHeader'
import { getNetworkGenesisTimestamp } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/constants/time-ranges'

type ChartType = 'bar' | 'line'

type BlockChartProps = {
  dataKey: keyof Pick<CumulativeDataPoint, 'gasUsed' | 'numTransactions' | 'usagePercentage'>
  title?: string
  color: string
  chartType?: ChartType
  yAxisUnit?: string
  yAxisFormatter?: (value: number) => string
}

// Helper function to get ordinal suffix for day
const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export const BlockChart = ({
  dataKey,
  title,
  color,
  chartType = 'bar',
  yAxisUnit,
  yAxisFormatter,
}: BlockChartProps) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('daily')
  const [_selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLiveMode, setIsLiveMode] = useState(true)
  const genesisTimestamp = getNetworkGenesisTimestamp(activeNetworkName)

  const selectedDate = isLiveMode ? new Date() : _selectedDate
  const { dataPoints, canGoBack, canGoForward } = useBlockChartData(
    selectedRange,
    selectedDate,
    isLiveMode,
    genesisTimestamp,
  )

  const totals = useMemo(() => {
    return dataPoints.reduce(
      (acc, point) => ({
        gasUsed: acc.gasUsed + point.gasUsed,
        gasLimit: acc.gasLimit + point.gasLimit,
        numTransactions: acc.numTransactions + point.numTransactions,
      }),
      { gasUsed: 0, gasLimit: 0, numTransactions: 0 },
    )
  }, [dataPoints])

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setIsLiveMode(false)
  }

  const handleResetToNow = () => {
    setSelectedDate(new Date())
    setSelectedRange('daily')
    setIsLiveMode(true)
  }

  const handleNavigateBack = () => {
    const rangeConfig = TIME_RANGES[selectedRange]
    const newDate = rangeConfig.sub(selectedDate, 1)
    setSelectedDate(newDate)
    setIsLiveMode(false)
  }

  const handleNavigateForward = () => {
    setIsLiveMode(false)
    if (selectedDate) {
      const rangeConfig = TIME_RANGES[selectedRange]
      if (rangeConfig.add) {
        const newDate = rangeConfig.add(selectedDate, 1)
        const now = new Date()
        if (newDate <= now) {
          setSelectedDate(newDate)
        }
      }
    }
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateStr = event.target.value
    if (!selectedDateStr) return

    let newSelectedDate: Date

    if (selectedRange === 'yearly' && selectedDateStr.match(/^\d{4}$/)) {
      const year = parseInt(selectedDateStr, 10)
      const now = new Date()
      if (!Number.isNaN(year) && year >= 2018 && year <= now.getFullYear()) {
        newSelectedDate = new Date(`${year}-01-01T00:00:00`)
      } else {
        return
      }
    } else if (selectedRange === 'monthly' && selectedDateStr.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = selectedDateStr.split('-').map(Number)
      newSelectedDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    } else if (selectedDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = selectedDateStr.split('-').map(Number)
      if (selectedRange === 'hourly') {
        const currentHour = selectedDate.getHours()
        newSelectedDate = new Date(year, month - 1, day, currentHour, 0, 0, 0)
      } else {
        newSelectedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
      }
    } else {
      return
    }

    const now = new Date()
    if (Number.isNaN(newSelectedDate.getTime()) || newSelectedDate > now) {
      return
    }

    setSelectedDate(newSelectedDate)
    setIsLiveMode(false)
  }

  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hourStr = event.target.value
    if (!hourStr) return

    const hour = parseInt(hourStr, 10)
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return

    const newSelectedDate = new Date(selectedDate)
    newSelectedDate.setHours(hour, 0, 0, 0)

    const now = new Date()
    if (newSelectedDate > now) {
      return
    }

    setSelectedDate(newSelectedDate)
    setIsLiveMode(false)
  }

  return (
    <Card>
      <TimeRangeHeader
        selectedRange={selectedRange}
        selectedDate={selectedDate}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onRangeChange={handleRangeChange}
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        onResetToNow={handleResetToNow}
        onDateChange={handleDateChange}
        onHourChange={handleHourChange}
        title={title}
      />
      <PeriodTotals dataKey={dataKey} totals={totals} color={color} />
      <Card variant="secondary">
        <BlockInnerChart
          data={dataPoints}
          selectedRange={selectedRange}
          dataKey={dataKey}
          color={color}
          chartType={chartType}
          yAxisUnit={yAxisUnit}
          yAxisFormatter={yAxisFormatter}
        />
      </Card>
    </Card>
  )
}

const PeriodTotals = ({
  dataKey,
  totals,
  color,
}: {
  dataKey: string
  totals: { gasUsed: number; gasLimit: number; numTransactions: number }
  color: string
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const usage = totals.gasLimit > 0 ? ((totals.gasUsed / totals.gasLimit) * 100).toFixed(2) : '0'

  if (dataKey === 'usagePercentage') {
    return (
      <HStack gap={{ base: 4, md: 8 }} flexWrap="wrap">
        <Flex alignItems="baseline" gap={2}>
          <Text fontSize="sm" color="text-secondary">
            {t('Avg Usage')}:
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={color}>
            {usage}%
          </Text>
        </Flex>
      </HStack>
    )
  }

  if (dataKey === 'gasUsed') {
    return (
      <HStack gap={{ base: 4, md: 8 }} flexWrap="wrap">
        <Flex alignItems="baseline" gap={2}>
          <Text fontSize="sm" color="text-secondary">
            {t('Total Gas Used')}:
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={color}>
            {formatNumber(Math.round(totals.gasUsed))}
          </Text>
        </Flex>
        <Flex alignItems="baseline" gap={2}>
          <Text fontSize="sm" color="text-secondary">
            {t('Total Gas Limit')}:
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="text-primary">
            {formatNumber(Math.round(totals.gasLimit))}
          </Text>
        </Flex>
        <Flex alignItems="baseline" gap={2}>
          <Text fontSize="sm" color="text-secondary">
            {t('Usage')}:
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="text-primary">
            {usage}%
          </Text>
        </Flex>
      </HStack>
    )
  }

  return (
    <HStack gap={{ base: 4, md: 8 }}>
      <Flex alignItems="baseline" gap={2}>
        <Text fontSize="sm" color="text-secondary">
          {t('Total Transactions')}:
        </Text>
        <Text fontSize="lg" fontWeight="bold" color={color}>
          {formatNumber(Math.round(totals.numTransactions))}
        </Text>
      </Flex>
    </HStack>
  )
}

const BlockInnerChart = ({
  data,
  selectedRange,
  dataKey,
  color,
  chartType,
  yAxisUnit,
  yAxisFormatter,
}: {
  data: CumulativeDataPoint[]
  selectedRange: TimeRangeKey
  dataKey: string
  color: string
  chartType: ChartType
  yAxisUnit?: string
  yAxisFormatter?: (value: number) => string
}) => {
  const formatNumber = useFormatNumber()

  const defaultFormatYAxis = useCallback(
    (value: number) => (dataKey === 'usagePercentage' ? `${Math.round(value)}` : formatNumber(Number(value) / 10 ** 6)),
    [formatNumber, dataKey],
  )
  const formatYAxisTick = yAxisFormatter ?? defaultFormatYAxis

  const chartHeight = useBreakpointValue({ base: '250px', md: '300px' })

  const formatXAxis = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp)

      switch (selectedRange) {
        case 'hourly':
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        case 'daily':
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        case 'weekly': {
          const weekDay = date.getDate()
          const weekMonth = date.toLocaleDateString(undefined, { month: 'short' })
          return `${weekMonth} ${weekDay}${getOrdinalSuffix(weekDay)}`
        }
        case 'monthly': {
          const day = date.getDate()
          const month = date.toLocaleDateString(undefined, { month: 'short' })
          return `${month} ${day}${getOrdinalSuffix(day)}`
        }
        case 'yearly':
          return date.toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
          })
        case 'all':
          return date.getFullYear().toString()
        default:
          return timeFormat(timestamp)
      }
    },
    [selectedRange],
  )

  const gradientId = `${dataKey}Gradient`
  const chartMargin = { top: 8, right: 8, bottom: -8, left: 0 }

  const sharedAxisProps = {
    xAxis: {
      dataKey: 'timestamp' as const,
      interval: 'equidistantPreserveStart' as const,
      textAnchor: 'middle' as const,
      tickLine: false,
      tickFormatter: formatXAxis,
      tick: { style: { fontSize: '.7rem' } },
      axisLine: false,
      stroke: 'white',
    },
    yAxis: {
      unit: yAxisUnit,
      dataKey,
      tickFormatter: formatYAxisTick,
      tick: { style: { fontSize: '.8rem' } },
      axisLine: false,
      stroke: 'white',
    },
  }

  const tooltipContent = (props: TooltipContentProps) => (
    <BlockChartTooltip {...props} selectedRange={selectedRange} dataKey={dataKey} />
  )

  return (
    <Box h={chartHeight}>
      <ResponsiveContainer>
        {chartType === 'line' ? (
          <AreaChart style={{ height: chartHeight }} margin={chartMargin} data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
            <XAxis {...sharedAxisProps.xAxis} />
            <YAxis {...sharedAxisProps.yAxis} />
            <Tooltip contentStyle={{ fontSize: '.8rem' }} content={tooltipContent} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        ) : (
          <BarChart style={{ height: chartHeight }} margin={chartMargin} data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
            <XAxis {...sharedAxisProps.xAxis} />
            <YAxis {...sharedAxisProps.yAxis} />
            <Tooltip
              contentStyle={{ fontSize: '.8rem' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              content={tooltipContent}
            />
            <Bar dataKey={dataKey} fill={`url(#${gradientId})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  )
}

const BlockChartTooltip = ({
  active,
  payload,
  dataKey,
}: TooltipContentProps & { selectedRange: TimeRangeKey; dataKey: string }) => {
  const isVisible = active && payload && payload.length > 0
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()

  if (!isVisible) return null

  const dataPoint = payload[0].payload as CumulativeDataPoint

  const formatDateTime = (timestamp: number) => {
    return formatDate(timestamp, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Date & Time')}:
        </Text>
        <Text fontSize="sm">{formatDateTime(dataPoint.timestamp)}</Text>
      </Flex>
      {dataKey === 'usagePercentage' ? (
        <Flex alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="bold">
            {t('Usage')}:
          </Text>
          <Text fontSize="sm">{dataPoint.usagePercentage.toFixed(2)}%</Text>
        </Flex>
      ) : dataKey === 'gasUsed' ? (
        <>
          <Flex alignItems="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold">
              {t('Total Gas Used')}:
            </Text>
            <Text fontSize="sm">{formatNumber(Math.round(dataPoint.gasUsed))}</Text>
          </Flex>
          <Flex alignItems="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold">
              {t('Total Gas Limit')}:
            </Text>
            <Text fontSize="sm">{formatNumber(Math.round(dataPoint.gasLimit))}</Text>
          </Flex>
          <Flex alignItems="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold">
              {t('Avg Usage')}:
            </Text>
            <Text fontSize="sm">{dataPoint.usagePercentage.toFixed(2)}%</Text>
          </Flex>
        </>
      ) : (
        <Flex alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="bold">
            {t('Total Transactions')}:
          </Text>
          <Text fontSize="sm">{formatNumber(Math.round(dataPoint.numTransactions))}</Text>
        </Flex>
      )}
    </Stack>
  )
}

const useBlockChartData = (
  range: TimeRangeKey,
  date: Date,
  isLiveMode: boolean = true,
  genesisTimestamp: number | null = null,
) => {
  const selectedRangeConfig = TIME_RANGES[range]

  const now = new Date()
  const minimumTimestamp = genesisTimestamp ?? 0
  let startTimestamp: number = minimumTimestamp
  let endTimestamp: number = getUnixTime(now)

  if (range === 'all') {
    startTimestamp = minimumTimestamp
    endTimestamp = getUnixTime(now)
  } else {
    const rangeConfig = TIME_RANGES[range]
    const periodStart = rangeConfig.startOf?.(date)
    const periodEnd = rangeConfig.endOf?.(date)
    const nowMinusRange = rangeConfig.sub?.(now, 1)
    startTimestamp = Math.min(getUnixTime(periodStart), getUnixTime(nowMinusRange))
    endTimestamp = Math.min(getUnixTime(periodEnd), getUnixTime(now))
  }

  const getBufferSeconds = (startTimestamp: number, endTimestamp: number): number => {
    const rangeSeconds = endTimestamp - startTimestamp
    if (rangeSeconds <= 4000) {
      return 10
    } else if (rangeSeconds <= 700000) {
      return 1800
    } else if (rangeSeconds <= 35000000) {
      return 43200
    } else {
      return 1296000
    }
  }

  const bufferSeconds = getBufferSeconds(startTimestamp, endTimestamp)
  const adjustedStartTimestamp =
    genesisTimestamp === null
      ? Math.max(0, startTimestamp - bufferSeconds)
      : Math.max(minimumTimestamp, startTimestamp - bufferSeconds)

  const canGoBack = true
  const canGoForward = date.getTime() !== now.getTime()

  const { data: cumulativeData = [], ...rest } = useBlockUsage(adjustedStartTimestamp, endTimestamp, isLiveMode)

  const allDataPoints = useMemo(
    () => transformBlockUsageCumulativeData(cumulativeData as BlockUsageData[]),
    [cumulativeData],
  )

  const dataPoints = useMemo(
    () => allDataPoints.filter(point => point.timestamp >= startTimestamp),
    [allDataPoints, startTimestamp],
  )

  return { dataPoints, selectedRangeConfig, canGoBack, canGoForward, ...rest }
}
