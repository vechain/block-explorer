'use client'

import { Box, Flex, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { getUnixTime } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { BlockUsageData } from '@/lib/schemas'
import { type BlockUsageDataPoint, transformBlockUsageData } from '@/lib/utils/block-usage'
import { timeFormat } from '@/lib/utils/date'
import { useBlockUsage } from '@/services/veworld-indexer/block-usage'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { BlockUsageHeader } from './components/BlockUsageHeader/BlockUsageHeader'
import { TIME_RANGES, type TimeRangeKey } from './constants'

const mainColor = '#E782FF'

// Use the type from the utility file
type DataPoint = BlockUsageDataPoint

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

export const BlockUsage = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('hourly')
  const [_selectedDate, setSelectedDate] = useState<Date>(new Date()) // User-selected specific date
  const [isLiveMode, setIsLiveMode] = useState(true) // Live mode updates with new blocks

  const selectedDate = isLiveMode ? new Date() : _selectedDate
  const { blocksDataPoints, canGoBack, canGoForward } = useBlockUsageChartData(selectedRange, selectedDate)

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setIsLiveMode(false)
  }

  const handleResetToNow = () => {
    setSelectedDate(new Date())
    setSelectedRange('hourly') // Reset to default hourly view
    setIsLiveMode(true) // Re-enable live mode
  }

  const handleNavigateBack = () => {
    const rangeConfig = TIME_RANGES[selectedRange]
    const newDate = rangeConfig.sub(selectedDate, 1)
    setSelectedDate(newDate)
    setIsLiveMode(false) // Exit live mode
  }

  const handleNavigateForward = () => {
    setIsLiveMode(false)
    if (selectedDate) {
      // If we have a selected date, move it forward by one period using date-fns
      const rangeConfig = TIME_RANGES[selectedRange]
      if (rangeConfig.add) {
        const newDate = rangeConfig.add(selectedDate, 1)
        const now = new Date()

        // Don't go beyond current time
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

    // Handle year input for yearly range
    if (selectedRange === 'yearly' && selectedDateStr.match(/^\d{4}$/)) {
      const year = parseInt(selectedDateStr, 10)
      const now = new Date()
      if (!Number.isNaN(year) && year >= 2018 && year <= now.getFullYear()) {
        newSelectedDate = new Date(`${year}-01-01T00:00:00`)
      } else {
        return // Invalid year
      }
    }
    // Parse date in local timezone to avoid UTC conversion issues
    else if (selectedRange === 'monthly' && selectedDateStr.match(/^\d{4}-\d{2}$/)) {
      // Month format: YYYY-MM (month is 1-indexed in the string, 0-indexed in Date constructor)
      const [year, month] = selectedDateStr.split('-').map(Number)
      newSelectedDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    } else if (selectedDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date format: YYYY-MM-DD (month is 1-indexed in the string, 0-indexed in Date constructor)
      const [year, month, day] = selectedDateStr.split('-').map(Number)
      // For hourly view, preserve the current hour when changing date
      if (selectedRange === 'hourly') {
        const currentHour = selectedDate.getHours()
        newSelectedDate = new Date(year, month - 1, day, currentHour, 0, 0, 0)
      } else {
        newSelectedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
      }
    } else {
      return // Invalid format
    }

    const now = new Date()

    // Validate the selected date
    if (Number.isNaN(newSelectedDate.getTime()) || newSelectedDate > now) {
      return // Invalid date or future date
    }

    // Set the selected date - the hook will handle calculating the right block range
    setSelectedDate(newSelectedDate)
    setIsLiveMode(false) // Exit live mode when selecting a specific date
  }

  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hourStr = event.target.value
    if (!hourStr) return

    const hour = parseInt(hourStr, 10)
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return

    // Create new date with the selected hour
    const newSelectedDate = new Date(selectedDate)
    newSelectedDate.setHours(hour, 0, 0, 0)

    const now = new Date()

    // Validate the selected date
    if (newSelectedDate > now) {
      return // Future date
    }

    setSelectedDate(newSelectedDate)
    setIsLiveMode(false) // Exit live mode when selecting a specific hour
  }

  return (
    <Card>
      <BlockUsageHeader
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
      />
      <Card variant="secondary">
        <BlockUsageChart data={blocksDataPoints} selectedRange={selectedRange} />
      </Card>
    </Card>
  )
}

const BlockUsageChart = ({ data, selectedRange }: { data: DataPoint[]; selectedRange: TimeRangeKey }) => {
  const router = useRouter()
  const formatNumber = useFormatNumber()

  type AreaClickEvent = {
    activePayload?: Array<{
      payload?: {
        id?: string | number
      }
    }>
  }

  const handleAreaClick = (data: unknown) => {
    const id = (data as AreaClickEvent | null)?.activePayload?.[0]?.payload?.id
    if (id === undefined || id === null) return
    router.push(`/block/${id}`)
  }

  // Memoized tick formatter for YAxis
  const formatYAxisTick = useCallback((value: number) => formatNumber(Number(value) / 10 ** 6), [formatNumber])

  const chartHeight = useBreakpointValue({ base: '250px', md: '300px' })

  // Format X-axis labels based on the selected time range
  const formatXAxis = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp)

      switch (selectedRange) {
        case 'hourly':
          // For hourly view, show time with minutes
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        case 'daily':
          // For daily view, show time only
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        case 'weekly': {
          // For weekly view, show month and day with ordinal
          const weekDay = date.getDate()
          const weekMonth = date.toLocaleDateString(undefined, { month: 'short' })
          return `${weekMonth} ${weekDay}${getOrdinalSuffix(weekDay)}`
        }
        case 'monthly': {
          // For monthly view, show month and day with ordinal
          const day = date.getDate()
          const month = date.toLocaleDateString(undefined, { month: 'short' })
          return `${month} ${day}${getOrdinalSuffix(day)}`
        }
        case 'yearly':
          // For yearly view, show month and year
          return date.toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
          })
        case 'all':
          // For all-time view, show year only
          return date.getFullYear().toString()
        default:
          return timeFormat(timestamp)
      }
    },
    [selectedRange],
  )

  return (
    <Box h={chartHeight}>
      <ResponsiveContainer>
        <AreaChart
          style={{ height: chartHeight }}
          margin={{
            top: 8,
            right: 8,
            bottom: -8,
            left: -16,
          }}
          data={data}
          onClick={handleAreaClick}
        >
          <defs>
            <linearGradient id="gasUsedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={mainColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="timestamp"
            interval={'equidistantPreserveStart'}
            textAnchor="middle"
            tickLine={false}
            tickFormatter={formatXAxis}
            tick={{ style: { fontSize: '.7rem' } }}
            axisLine={false}
            stroke="white"
          />
          <YAxis
            unit="M"
            dataKey="gasLimit"
            tickFormatter={formatYAxisTick}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
            stroke="white"
          />

          <Tooltip
            contentStyle={{ fontSize: '.8rem' }}
            content={(props: TooltipContentProps<number, string>) => (
              <CustomTooltip {...props} selectedRange={selectedRange} />
            )}
          />
          <Area
            type="monotone"
            dataKey="gasUsed"
            stroke={mainColor}
            strokeWidth={2}
            fill="url(#gasUsedGradient)"
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

const CustomTooltip = ({
  active,
  payload,
  selectedRange,
}: TooltipContentProps<number, string> & { selectedRange: TimeRangeKey }) => {
  const isVisible = active && payload.length > 0
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()

  if (!isVisible) return null

  const dataPoint = payload[0].payload as DataPoint

  // Determine if we should show average labels based on range
  const isAggregated = selectedRange !== 'hourly'

  const labels = {
    identifier: t('Date & Time'),
    gasUsed: isAggregated ? t('Avg Gas Used/Block') : t('Gas Used'),
    gasLimit: isAggregated ? t('Avg Gas Limit/Block') : t('Gas Limit'),
    usage: isAggregated ? t('Avg Usage') : t('Usage'),
  }

  // Format the date and time for the data point
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
      {selectedRange === 'hourly' && (
        <Flex alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="bold">
            {t('Block Number')}:
          </Text>
          <Text fontSize="sm">{formatNumber(dataPoint.number)}</Text>
        </Flex>
      )}
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {labels.identifier}:
        </Text>
        <Text fontSize="sm">{formatDateTime(dataPoint.timestamp)}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {labels.gasUsed}:
        </Text>
        <Text fontSize="sm">{formatNumber(Math.round(dataPoint.gasUsed))}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {labels.gasLimit}:
        </Text>
        <Text fontSize="sm">{formatNumber(Math.round(dataPoint.gasLimit))}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {labels.usage}:
        </Text>
        <Text fontSize="sm">{((dataPoint.gasUsed / dataPoint.gasLimit) * 100).toFixed(2)}%</Text>
      </Flex>
    </Stack>
  )
}

const useBlockUsageChartData = (range: TimeRangeKey, date: Date, isLiveMode: boolean = true) => {
  // Get the selected range configuration
  const selectedRangeConfig = TIME_RANGES[range]

  // VeChain genesis timestamp
  const GENESIS_TIMESTAMP = 1530316800

  const now = new Date()
  let startTimestamp: number = GENESIS_TIMESTAMP
  let endTimestamp: number = getUnixTime(now)

  // When a specific date is selected, use date-fns to calculate exact period boundaries
  if (range === 'all') {
    startTimestamp = GENESIS_TIMESTAMP
    endTimestamp = getUnixTime(now)
  } else {
    const rangeConfig = TIME_RANGES[range]
    const periodStart = rangeConfig.startOf?.(date)
    const periodEnd = rangeConfig.endOf?.(date)

    const nowMinusRange = rangeConfig.sub?.(now, 1)
    startTimestamp = Math.min(getUnixTime(periodStart), getUnixTime(nowMinusRange))
    endTimestamp = Math.min(getUnixTime(periodEnd), getUnixTime(now))
  }

  // Calculate buffer needed before startTimestamp to get the baseline record
  // This ensures we have a previous record to calculate the first data point in our range
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
  const adjustedStartTimestamp = Math.max(GENESIS_TIMESTAMP, startTimestamp - bufferSeconds)

  // Calculate navigation constraints
  // Can always go back unless we're literally at genesis
  const canGoBack = true
  // Can go forward if we have an offset or selected date (meaning we're not at current time)
  const canGoForward = date.getTime() !== now.getTime()

  // Fetch block usage data from indexer with buffered start timestamp
  // In live mode, enable refetching; in historical mode, disable it
  const { data: cumulativeData = [], ...rest } = useBlockUsage(adjustedStartTimestamp, endTimestamp, isLiveMode)

  // Transform cumulative data to per-block values
  const allDataPoints = useMemo(() => transformBlockUsageData(cumulativeData as BlockUsageData[]), [cumulativeData])

  // Filter to only include data points within the requested range (exclude buffer)
  const blocksDataPoints = useMemo(
    () => allDataPoints.filter(point => point.timestamp >= startTimestamp),
    [allDataPoints, startTimestamp],
  )

  return { blocksDataPoints, selectedRangeConfig, canGoBack, canGoForward, ...rest }
}
