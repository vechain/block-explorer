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
import type { BlockUsageData } from '@/lib/schemas'
import { transformBlockUsageCumulativeData } from '@/lib/utils/block-usage'
import { timeFormat } from '@/lib/utils/date'
import { useBlockUsage } from '@/services/veworld-indexer/block-usage'
import { useFormatCurrency, useFormatDate } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { TimeRangeHeader } from '@/components/TimeRangeHeader/TimeRangeHeader'
import { getNetworkGenesisTimestamp } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/constants/time-ranges'

const VTHO_PER_GAS = 0.001
const CHART_COLOR = '#4ADE80'

type AFPTDataPoint = {
  timestamp: number
  afpt: number
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

export const AFPTChart = () => {
  const { t } = useTranslation()
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('hourly')
  const [_selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLiveMode, setIsLiveMode] = useState(true)
  const genesisTimestamp = getNetworkGenesisTimestamp(activeNetworkName)

  const selectedDate = isLiveMode ? new Date() : _selectedDate
  const { dataPoints, canGoBack, canGoForward } = useAFPTData(selectedRange, selectedDate, isLiveMode, genesisTimestamp)

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setIsLiveMode(false)
  }

  const handleResetToNow = () => {
    setSelectedDate(new Date())
    setSelectedRange('hourly')
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

  const avgAFPT =
    dataPoints.length > 0
      ? dataPoints.reduce((acc: number, curr: AFPTDataPoint) => acc + curr.afpt, 0) / dataPoints.length
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
        title={t('Average Fees Per Transaction (AFPT)')}
      />
      <AFPTPeriodTotal avgAFPT={avgAFPT} />
      <Card variant="secondary">
        <AFPTInnerChart data={dataPoints} selectedRange={selectedRange} />
      </Card>
    </Card>
  )
}

const AFPTPeriodTotal = ({ avgAFPT }: { avgAFPT: number }) => {
  const { t } = useTranslation()
  const formatCurrency = useFormatCurrency()

  return (
    <HStack gap={{ base: 4, md: 8 }} flexWrap="wrap">
      <Flex alignItems="baseline" gap={2}>
        <Text fontSize="sm" color="text-secondary">
          {t('Avg AFPT')}:
        </Text>
        <Text fontSize="lg" fontWeight="bold" color={CHART_COLOR}>
          {formatCurrency(avgAFPT)}
        </Text>
      </Flex>
    </HStack>
  )
}

const AFPTInnerChart = ({ data, selectedRange }: { data: AFPTDataPoint[]; selectedRange: TimeRangeKey }) => {
  const formatCurrency = useFormatCurrency()
  const chartHeight = useBreakpointValue({ base: '250px', md: '300px' })

  const formatYAxisTick = useCallback((value: number) => formatCurrency(value), [formatCurrency])

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

  const gradientId = 'afptGradient'
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
            dataKey="afpt"
            tickFormatter={formatYAxisTick}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
            stroke="white"
          />
          <Tooltip
            contentStyle={{ fontSize: '.8rem' }}
            content={(props: TooltipContentProps) => <AFPTTooltip {...props} selectedRange={selectedRange} />}
          />
          <Area
            type="monotone"
            dataKey="afpt"
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

const AFPTTooltip = ({ active, payload }: TooltipContentProps & { selectedRange: TimeRangeKey }) => {
  const isVisible = active && payload && payload.length > 0
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatCurrency = useFormatCurrency()

  if (!isVisible) return null

  const dataPoint = payload[0].payload as AFPTDataPoint

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
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('AFPT')}:
        </Text>
        <Text fontSize="sm">{formatCurrency(dataPoint.afpt)}</Text>
      </Flex>
    </Stack>
  )
}

const useAFPTData = (
  range: TimeRangeKey,
  date: Date,
  isLiveMode: boolean = true,
  genesisTimestamp: number | null = null,
) => {
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

  const { data: cumulativeData = [] } = useBlockUsage(adjustedStartTimestamp, endTimestamp, isLiveMode)
  const { price: vthoPrice = 0 } = useTokenDailyPrices('vethor-token')

  const allDataPoints = useMemo(
    () => transformBlockUsageCumulativeData(cumulativeData as BlockUsageData[]),
    [cumulativeData],
  )

  const dataPoints: AFPTDataPoint[] = useMemo(
    () =>
      allDataPoints
        .filter(point => point.timestamp >= startTimestamp)
        .map(point => ({
          timestamp: point.timestamp,
          afpt: point.numTransactions > 0 ? (point.gasUsed * VTHO_PER_GAS * vthoPrice) / point.numTransactions : 0,
        })),
    [allDataPoints, startTimestamp, vthoPrice],
  )

  return { dataPoints, canGoBack, canGoForward }
}
