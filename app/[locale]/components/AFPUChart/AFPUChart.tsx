'use client'

import { Box, Flex, HStack, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { getUnixTime } from 'date-fns'
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
import type { AFPUData } from '@/lib/schemas'
import { timeFormat } from '@/lib/utils/date'
import { useAverageFeesPerUser } from '@/services/veworld-indexer/average-fees-per-user'
import { useFormatCurrency, useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { TimeRangeHeader } from '@/components/TimeRangeHeader/TimeRangeHeader'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/constants/time-ranges'

const CHART_COLOR = '#FF8A65'

type AFPUDataPoint = {
  timestamp: number
  afpu: number
  dailyActiveUsers: number
  totalFeesPaid: number
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

export const AFPUChart = () => {
  const { t } = useTranslation()
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('weekly')
  const [_selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLiveMode, setIsLiveMode] = useState(true)

  const selectedDate = isLiveMode ? new Date() : _selectedDate
  const { dataPoints, canGoBack, canGoForward } = useAFPUData(selectedRange, selectedDate, isLiveMode)

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setIsLiveMode(false)
  }

  const handleResetToNow = () => {
    setSelectedDate(new Date())
    setSelectedRange('weekly')
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
      newSelectedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
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

  const avgAFPU =
    dataPoints.length > 0
      ? dataPoints.reduce((acc: number, curr: AFPUDataPoint) => acc + curr.afpu, 0) / dataPoints.length
      : 0

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
        title={t('Average Fees Per User (AFPU)')}
        excludeRanges={['hourly', 'daily']}
      />
      <AFPUPeriodTotal avgAFPU={avgAFPU} />
      <Card variant="secondary">
        <AFPUInnerChart data={dataPoints} selectedRange={selectedRange} />
      </Card>
    </Card>
  )
}

const AFPUPeriodTotal = ({ avgAFPU }: { avgAFPU: number }) => {
  const { t } = useTranslation()
  const formatCurrency = useFormatCurrency()

  return (
    <HStack gap={{ base: 4, md: 8 }} flexWrap="wrap">
      <Flex alignItems="baseline" gap={2}>
        <Text fontSize="sm" color="text-secondary">
          {t('Avg AFPU')}:
        </Text>
        <Text fontSize="lg" fontWeight="bold" color={CHART_COLOR}>
          {formatCurrency(avgAFPU)}
        </Text>
      </Flex>
    </HStack>
  )
}

const AFPUInnerChart = ({ data, selectedRange }: { data: AFPUDataPoint[]; selectedRange: TimeRangeKey }) => {
  const formatCurrency = useFormatCurrency()
  const chartHeight = useBreakpointValue({ base: '250px', md: '300px' })

  const formatYAxisTick = useCallback((value: number) => formatCurrency(value), [formatCurrency])

  const formatXAxis = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp * 1000)

      switch (selectedRange) {
        case 'hourly':
        case 'daily':
          return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
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

  const gradientId = 'afpuGradient'
  const chartMargin = { top: 8, right: 8, bottom: -8, left: 0 }

  return (
    <Box h={chartHeight}>
      <ResponsiveContainer>
        <AreaChart style={{ height: chartHeight }} margin={chartMargin} data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="timestamp"
            interval="equidistantPreserveStart"
            textAnchor="middle"
            tickLine={false}
            tickFormatter={formatXAxis}
            tick={{ style: { fontSize: '.7rem' } }}
            axisLine={false}
            stroke="white"
          />
          <YAxis
            dataKey="afpu"
            tickFormatter={formatYAxisTick}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
            stroke="white"
          />
          <Tooltip
            contentStyle={{ fontSize: '.8rem' }}
            content={(props: TooltipContentProps<number, string>) => (
              <AFPUTooltip {...props} selectedRange={selectedRange} />
            )}
          />
          <Area
            type="monotone"
            dataKey="afpu"
            stroke={CHART_COLOR}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

const AFPUTooltip = ({ active, payload }: TooltipContentProps<number, string> & { selectedRange: TimeRangeKey }) => {
  const isVisible = active && payload && payload.length > 0
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatCurrency = useFormatCurrency()
  const formatNumber = useFormatNumber()

  if (!isVisible) return null

  const dataPoint = payload[0].payload as AFPUDataPoint

  const formatDateTime = (timestamp: number) => {
    return formatDate(timestamp * 1000, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Date')}:
        </Text>
        <Text fontSize="sm">{formatDateTime(dataPoint.timestamp)}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('AFPU')}:
        </Text>
        <Text fontSize="sm">{formatCurrency(dataPoint.afpu)}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Daily Active Users')}:
        </Text>
        <Text fontSize="sm">{formatNumber(dataPoint.dailyActiveUsers, { maximumFractionDigits: 0 })}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Total Fees Paid')}:
        </Text>
        <Text fontSize="sm">{formatCurrency(dataPoint.totalFeesPaid)}</Text>
      </Flex>
    </Stack>
  )
}

const useAFPUData = (range: TimeRangeKey, date: Date, isLiveMode: boolean = true) => {
  const GENESIS_TIMESTAMP = 1530316800

  const now = new Date()
  let startTimestamp: number = GENESIS_TIMESTAMP
  let endTimestamp: number = getUnixTime(now)

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

  const canGoBack = true
  const canGoForward = date.getTime() !== now.getTime()

  const { data: afpuData = [] } = useAverageFeesPerUser(startTimestamp, endTimestamp, isLiveMode)
  const { price: vthoPrice = 0 } = useTokenDailyPrices('vethor-token')

  const dataPoints: AFPUDataPoint[] = useMemo(
    () =>
      (afpuData as AFPUData[])
        .filter(point => point.dayStartTimestamp >= startTimestamp)
        .map(point => ({
          timestamp: point.dayStartTimestamp,
          afpu: point.averageFeesPerUser * vthoPrice,
          dailyActiveUsers: point.dailyActiveUsers,
          totalFeesPaid: point.totalFeesPaid * vthoPrice,
        })),
    [afpuData, startTimestamp, vthoPrice],
  )

  return { dataPoints, canGoBack, canGoForward }
}
