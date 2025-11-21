'use client'

import {
  Box,
  Button,
  createListCollection,
  Flex,
  Heading,
  IconButton,
  Input,
  Portal,
  Select,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfHour,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getUnixTime,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subHours,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LuChevronLeft, LuChevronRight, LuRotateCcw } from 'react-icons/lu'
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
import { Surface } from '@/components/ui/Surface'
import type { BlockUsageData } from '@/lib/schemas'
import { type BlockUsageDataPoint, transformBlockUsageData } from '@/lib/utils/block-usage'
import { timeFormat } from '@/lib/utils/date'
import { useBlockUsage } from '@/services/veworld-indexer/block-usage'

const chartHeight = '420px'
const mainColor = '#E782FF'

// Time range options based on API granularity rules (in seconds)
const TIME_RANGES = {
  hourly: { label: 'Hourly', seconds: 3600 }, // 1 hour
  daily: { label: 'Daily', seconds: 86400 }, // 1 day
  weekly: { label: 'Weekly', seconds: 604800 }, // 1 week
  monthly: { label: 'Monthly', seconds: 2592000 }, // 30 days
  yearly: { label: 'Yearly', seconds: 31536000 }, // 365 days
  all: { label: 'All Time', seconds: 0 }, // Special case - from genesis to now
} as const

type TimeRangeKey = keyof typeof TIME_RANGES

type TimeRangeItem = { label: string; value: TimeRangeKey }

const timeRangeCollection = createListCollection<TimeRangeItem>({
  items: Object.entries(TIME_RANGES).map(([key, config]) => ({
    label: config.label,
    value: key as TimeRangeKey,
  })),
})

// Use the type from the utility file
type DataPoint = BlockUsageDataPoint

export const BlockUsage = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('hourly')
  const [timeOffset, setTimeOffset] = useState(0) // Number of periods to go back in time
  const [selectedDate, setSelectedDate] = useState<Date | null>(null) // User-selected specific date
  const [isLiveMode, setIsLiveMode] = useState(true) // Live mode updates with new blocks

  const { blocksDataPoints, isLoading, currentPeriodStart, canGoBack, canGoForward } = useBlockUsageChartData(
    selectedRange,
    timeOffset,
    selectedDate,
    isLiveMode,
  )

  if (isLoading) return <Skeleton height={chartHeight} rounded="xl" />

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setTimeOffset(0) // Reset to current time when changing ranges
    setSelectedDate(null) // Clear selected date when changing ranges

    // Exit live mode when changing from default hourly view
    if (newRange !== 'hourly') {
      setIsLiveMode(false)
    }
  }

  const handleResetToNow = () => {
    setTimeOffset(0)
    setSelectedDate(null) // Clear selected date when resetting
    setSelectedRange('hourly') // Reset to default hourly view
    setIsLiveMode(true) // Re-enable live mode
  }

  const handleNavigateBack = () => {
    if (selectedDate) {
      // If we have a selected date, move it back by one period
      let newDate: Date
      switch (selectedRange) {
        case 'hourly':
          newDate = subHours(selectedDate, 1)
          break
        case 'daily':
          newDate = subDays(selectedDate, 1)
          break
        case 'weekly':
          newDate = subWeeks(selectedDate, 1)
          break
        case 'monthly':
          newDate = subMonths(selectedDate, 1)
          break
        case 'yearly':
          newDate = subYears(selectedDate, 1)
          break
        default:
          return
      }
      setSelectedDate(newDate)
    } else {
      // If using offset, increment it
      setTimeOffset(prev => prev + 1)
    }
    setIsLiveMode(false) // Exit live mode
  }

  const handleNavigateForward = () => {
    if (selectedDate) {
      // If we have a selected date, move it forward by one period
      let newDate: Date
      const now = new Date()

      switch (selectedRange) {
        case 'hourly':
          newDate = addHours(selectedDate, 1) // Add 1 hour
          break
        case 'daily':
          newDate = addDays(selectedDate, 1) // Add 1 day
          break
        case 'weekly':
          newDate = addWeeks(selectedDate, 1) // Add 1 week
          break
        case 'monthly':
          newDate = addMonths(selectedDate, 1) // Add 1 month
          break
        case 'yearly':
          newDate = addYears(selectedDate, 1) // Add 1 year
          break
        default:
          return
      }

      // Don't go beyond current time
      if (newDate <= now) {
        setSelectedDate(newDate)
      }
    } else if (timeOffset > 0) {
      // If using offset, decrement it
      setTimeOffset(prev => prev - 1)
    }
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateStr = event.target.value
    if (!selectedDateStr) return

    let newSelectedDate: Date

    // Parse date in local timezone to avoid UTC conversion issues
    if (selectedRange === 'monthly' && selectedDateStr.match(/^\d{4}-\d{2}$/)) {
      // Month format: YYYY-MM
      const [year, month] = selectedDateStr.split('-').map(Number)
      newSelectedDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    } else if (selectedDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date format: YYYY-MM-DD
      const [year, month, day] = selectedDateStr.split('-').map(Number)
      newSelectedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    } else {
      return // Invalid format
    }

    const now = new Date()

    // Validate the selected date
    if (isNaN(newSelectedDate.getTime()) || newSelectedDate > now) {
      return // Invalid date or future date
    }

    // Set the selected date - the hook will handle calculating the right block range
    setSelectedDate(newSelectedDate)
    setTimeOffset(0) // Reset offset when selecting a specific date
    setIsLiveMode(false) // Exit live mode when selecting a specific date
  }

  // Format date for the date input based on selected range
  const getDateInputValue = () => {
    if (!currentPeriodStart) return ''

    const date = new Date(currentPeriodStart * 1000)

    // For yearly view, use year picker
    if (selectedRange === 'yearly') {
      return date.getFullYear().toString()
    }

    // For monthly view, use month picker
    if (selectedRange === 'monthly') {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    }

    // For all other views, use date picker (format in local timezone)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get the appropriate input type and attributes based on range
  const getDateInputProps = () => {
    const now = new Date()

    switch (selectedRange) {
      case 'yearly':
        return {
          type: 'number' as const,
          placeholder: 'Year',
          min: 2018,
          max: now.getFullYear(),
          value: currentPeriodStart ? new Date(currentPeriodStart * 1000).getFullYear() : '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const year = parseInt(e.target.value)
            if (year && year >= 2018 && year <= now.getFullYear()) {
              const newSelectedDate = new Date(`${year}-01-01T00:00:00`)
              setSelectedDate(newSelectedDate)
              setTimeOffset(0)
              setIsLiveMode(false)
            }
          },
        }
      case 'monthly':
        return {
          type: 'month' as const,
          value: getDateInputValue(),
          max: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          onChange: handleDateChange,
        }
      default:
        return {
          type: 'date' as const,
          value: getDateInputValue(),
          max: now.toISOString().split('T')[0],
          onChange: handleDateChange,
        }
    }
  }

  return (
    <Surface>
      <Flex justify="space-between" align="center">
        <Heading as="h2" textStyle="displayXs">
          Block Usage
        </Heading>

        <Flex align="center" gap={4} flexShrink={0}>
          {/* Time Navigation Controls */}
          {selectedRange !== 'all' && (
            <Flex align="center" gap={2}>
              <IconButton
                aria-label="Go back one period"
                size="sm"
                variant="outline"
                onClick={handleNavigateBack}
                disabled={!canGoBack}>
                <LuChevronLeft />
              </IconButton>

              <Input {...getDateInputProps()} size="sm" width="140px" />

              <IconButton
                aria-label="Go forward one period"
                size="sm"
                variant="outline"
                onClick={handleNavigateForward}
                disabled={!canGoForward}>
                <LuChevronRight />
              </IconButton>

              <Button size="sm" variant="outline" onClick={handleResetToNow}>
                <LuRotateCcw />
                Now
              </Button>
            </Flex>
          )}

          <Select.Root
            collection={timeRangeCollection}
            value={[selectedRange]}
            onValueChange={details => handleRangeChange(details.value[0] as TimeRangeKey)}
            width="200px">
            <Select.Trigger bg="bg">
              <Select.ValueText placeholder="Select time range" />
            </Select.Trigger>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {timeRangeCollection.items.map(item => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Flex>
      </Flex>

      <Surface>
        <BlockUsageChart data={blocksDataPoints} selectedRange={selectedRange} />
      </Surface>
    </Surface>
  )
}

const BlockUsageChart = ({ data, selectedRange }: { data: DataPoint[]; selectedRange: TimeRangeKey }) => {
  const router = useRouter()

  const handleAreaClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.id) {
      router.push(`/block/${data.activePayload[0].payload.id}`)
    }
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

  // Format X-axis labels based on the selected time range
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000)

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
  }

  // Calculate appropriate interval based on data length
  const getXAxisInterval = () => {
    const dataLength = data.length
    if (dataLength <= 20) return 0 // Show all labels for small datasets
    if (dataLength <= 50) return Math.floor(dataLength / 10)
    if (dataLength <= 100) return Math.floor(dataLength / 8)
    return Math.floor(dataLength / 10)
  }

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
          onClick={handleAreaClick}>
          <defs>
            <linearGradient id="gasUsedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={mainColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="timestamp"
            interval={getXAxisInterval()}
            textAnchor="middle"
            tickLine={false}
            tickFormatter={formatXAxis}
            tick={{ style: { fontSize: '.7rem' } }}
            axisLine={false}
          />
          <YAxis
            unit="M"
            dataKey="gasLimit"
            tickFormatter={value => (Number(value) / 10 ** 6).toLocaleString()}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
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

  if (!isVisible) return null

  const dataPoint = payload[0].payload as DataPoint

  // Determine if we should show average labels based on range
  const isAggregated = selectedRange !== 'hourly'

  const labels = {
    identifier: 'Date & Time',
    gasUsed: isAggregated ? 'Avg Gas Used/Block' : 'Gas Used',
    gasLimit: isAggregated ? 'Avg Gas Limit/Block' : 'Gas Limit',
    usage: isAggregated ? 'Avg Usage' : 'Usage',
  }

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

  return (
    <Stack bg="bg" rounded="xl" p={4}>
      {selectedRange === 'hourly' && (
        <Flex alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="bold">
            Block Number:
          </Text>
          <Text fontSize="sm">{dataPoint.number.toLocaleString()}</Text>
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
        <Text fontSize="sm">{Math.round(dataPoint.gasUsed).toLocaleString()}</Text>
      </Flex>

      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {labels.gasLimit}:
        </Text>
        <Text fontSize="sm">{Math.round(dataPoint.gasLimit).toLocaleString()}</Text>
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

const useBlockUsageChartData = (
  selectedRange: TimeRangeKey,
  timeOffset: number = 0,
  selectedDate: Date | null = null,
  isLiveMode: boolean = true,
) => {
  // Get the selected range configuration
  const selectedRangeConfig = TIME_RANGES[selectedRange]

  // VeChain genesis timestamp
  const GENESIS_TIMESTAMP = 1530316800

  const now = new Date()
  let startTimestamp: number = GENESIS_TIMESTAMP
  let endTimestamp: number = getUnixTime(now)

  if (selectedDate) {
    // When a specific date is selected, use date-fns to calculate exact period boundaries
    let periodStart: Date
    let periodEnd: Date

    switch (selectedRange) {
      case 'hourly':
        periodStart = startOfHour(selectedDate)
        periodEnd = endOfHour(selectedDate)
        break
      case 'daily':
        periodStart = startOfDay(selectedDate)
        periodEnd = endOfDay(selectedDate)
        break
      case 'weekly':
        periodStart = startOfWeek(selectedDate)
        periodEnd = endOfWeek(selectedDate)
        break
      case 'monthly':
        periodStart = startOfMonth(selectedDate)
        periodEnd = endOfMonth(selectedDate)
        break
      case 'yearly':
        periodStart = startOfYear(selectedDate)
        periodEnd = endOfYear(selectedDate)
        break
      case 'all':
        startTimestamp = GENESIS_TIMESTAMP
        endTimestamp = getUnixTime(now)
        break
    }

    if (selectedRange !== 'all') {
      startTimestamp = getUnixTime(periodStart!)
      endTimestamp = Math.min(getUnixTime(periodEnd!), getUnixTime(now))
    }
  } else {
    // Use the offset-based calculation when no specific date is selected
    let periodStart: Date
    let periodEnd: Date

    if (selectedRange === 'all') {
      // All time - from genesis to now
      startTimestamp = GENESIS_TIMESTAMP
      endTimestamp = getUnixTime(now)
    } else {
      // Calculate period boundaries using date-fns based on offset
      switch (selectedRange) {
        case 'hourly':
          // For hourly in live mode (offset = 0), show past hour from now
          // For offset > 0, show complete hours
          if (timeOffset === 0) {
            periodEnd = now
            periodStart = subHours(now, 1)
          } else {
            periodEnd = endOfHour(subHours(now, timeOffset))
            periodStart = startOfHour(subHours(now, timeOffset))
          }
          break
        case 'daily':
          periodEnd = endOfDay(subDays(now, timeOffset))
          periodStart = startOfDay(subDays(now, timeOffset))
          break
        case 'weekly':
          periodEnd = endOfWeek(subWeeks(now, timeOffset))
          periodStart = startOfWeek(subWeeks(now, timeOffset))
          break
        case 'monthly':
          periodEnd = endOfMonth(subMonths(now, timeOffset))
          periodStart = startOfMonth(subMonths(now, timeOffset))
          break
        case 'yearly':
          periodEnd = endOfYear(subYears(now, timeOffset))
          periodStart = startOfYear(subYears(now, timeOffset))
          break
        default:
          periodEnd = now
          periodStart = now
      }

      startTimestamp = getUnixTime(periodStart)
      endTimestamp = getUnixTime(periodEnd)
    }
  }

  // Calculate buffer needed before startTimestamp to get the baseline record
  // This ensures we have a previous record to calculate the first data point in our range
  const getBufferSeconds = (rangeSeconds: number) => {
    if (rangeSeconds <= 3600) {
      // ≤ 1 hour - returns all blocks, need 1 block buffer (~10 seconds)
      return 10
    } else if (rangeSeconds <= 604800) {
      // ≤ 1 week - returns hourly, need 1 hour buffer
      return 3600
    } else if (rangeSeconds <= 2592000) {
      // ≤ 1 month - returns daily, need 1 day buffer
      return 86400
    } else if (rangeSeconds <= 31536000) {
      // ≤ 1 year - returns weekly, need 1 week buffer
      return 604800
    } else {
      // > 1 year - returns monthly, need ~1 month buffer
      return 2592000
    }
  }

  const rangeSeconds = selectedRangeConfig.seconds || endTimestamp - startTimestamp
  const bufferSeconds = getBufferSeconds(rangeSeconds)
  const adjustedStartTimestamp = Math.max(GENESIS_TIMESTAMP, startTimestamp - bufferSeconds)

  // Calculate navigation constraints
  // Can always go back unless we're literally at genesis
  const canGoBack = true
  // Can go forward if we have an offset or selected date (meaning we're not at current time)
  const canGoForward = timeOffset > 0 || selectedDate !== null

  // Fetch block usage data from indexer with buffered start timestamp
  // In live mode, enable refetching; in historical mode, disable it
  const { data: cumulativeData = [], ...rest } = useBlockUsage(adjustedStartTimestamp, endTimestamp, isLiveMode)

  // Transform cumulative data to per-block values
  const allDataPoints = transformBlockUsageData(cumulativeData as BlockUsageData[])

  // Filter to only include data points within the requested range (exclude buffer)
  const blocksDataPoints = allDataPoints.filter(point => point.timestamp >= startTimestamp)

  // Calculate the current period start timestamp for the date picker
  const currentPeriodStart = blocksDataPoints.length > 0 ? blocksDataPoints[0].timestamp : null

  return { blocksDataPoints, selectedRangeConfig, currentPeriodStart, canGoBack, canGoForward, ...rest }
}
