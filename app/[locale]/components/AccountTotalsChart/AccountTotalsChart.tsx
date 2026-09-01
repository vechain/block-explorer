'use client'

import { Box, Flex, Skeleton, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { getUnixTime } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { TimeRangeHeader } from '@/components/TimeRangeHeader/TimeRangeHeader'
import { Card } from '@/components/ui/Card'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { getNetworkGenesisTimestamp } from '@/lib/constants/network'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/constants/time-ranges'
import { useSettingsStore } from '@/lib/stores/settings'
import { timeFormat } from '@/lib/utils/date'
import { useAccountTotals } from '@/services/veworld-indexer/account-totals'

const CHART_COLOR = '#38BDF8'
const GROWTH_CHART_COLOR = '#F59E0B'

type AccountTotalsDataPoint = {
  timestamp: number
  totalAccounts: number
}

type AccountGrowthDataPoint = {
  timestamp: number
  accountGrowth: number
}

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

export const AccountTotalsChart = () => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const genesisTimestamp = getNetworkGenesisTimestamp(activeNetworkName)

  return (
    <Stack gap={8} w="full">
      <AccountTotalsCard genesisTimestamp={genesisTimestamp} />
      <AccountGrowthCard genesisTimestamp={genesisTimestamp} />
    </Stack>
  )
}

const AccountTotalsCard = ({ genesisTimestamp }: { genesisTimestamp: number | null }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const controls = useAccountChartControls(genesisTimestamp)
  const { dataPoints, canGoBack, canGoForward, isPending } = useAccountTotalsChartData(
    controls.selectedRange,
    controls.selectedDate,
    controls.isLiveMode,
    genesisTimestamp,
  )

  const hasData = dataPoints.length > 0
  const isInitialLoading = isPending && !hasData
  const currentTotal = dataPoints[dataPoints.length - 1]?.totalAccounts ?? 0

  return (
    <Card>
      <TimeRangeHeader
        selectedRange={controls.selectedRange}
        selectedDate={controls.selectedDate}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onRangeChange={controls.handleRangeChange}
        onNavigateBack={controls.handleNavigateBack}
        onNavigateForward={controls.handleNavigateForward}
        onResetToNow={controls.handleResetToNow}
        onDateChange={controls.handleDateChange}
        onHourChange={controls.handleHourChange}
        title={t('Total Accounts')}
      />
      <Flex alignItems="baseline" gap={2}>
        <Text fontSize="sm" color="text-secondary">
          {t('Total Accounts')}:
        </Text>
        {isInitialLoading ? (
          <Skeleton height="28px" width="120px" />
        ) : (
          <Text fontSize="lg" fontWeight="bold" color={CHART_COLOR}>
            {formatNumber(currentTotal)}
          </Text>
        )}
      </Flex>
      <Card variant="secondary">
        {isInitialLoading ? (
          <Skeleton h={{ base: '250px', md: '300px' }} rounded="xl" />
        ) : (
          <AccountTotalsInnerChart data={dataPoints} selectedRange={controls.selectedRange} />
        )}
      </Card>
    </Card>
  )
}

const AccountGrowthCard = ({ genesisTimestamp }: { genesisTimestamp: number | null }) => {
  const { t } = useTranslation()
  const controls = useAccountChartControls(genesisTimestamp)
  const { dataPoints, canGoBack, canGoForward, isPending } = useAccountTotalsChartData(
    controls.selectedRange,
    controls.selectedDate,
    controls.isLiveMode,
    genesisTimestamp,
  )

  const growthDataPoints = useMemo<AccountGrowthDataPoint[]>(
    () =>
      dataPoints.map((point, index) => ({
        timestamp: point.timestamp,
        accountGrowth: index === 0 ? 0 : point.totalAccounts - dataPoints[index - 1].totalAccounts,
      })),
    [dataPoints],
  )

  const hasData = growthDataPoints.length > 0
  const isInitialLoading = isPending && !hasData

  return (
    <Card>
      <TimeRangeHeader
        selectedRange={controls.selectedRange}
        selectedDate={controls.selectedDate}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onRangeChange={controls.handleRangeChange}
        onNavigateBack={controls.handleNavigateBack}
        onNavigateForward={controls.handleNavigateForward}
        onResetToNow={controls.handleResetToNow}
        onDateChange={controls.handleDateChange}
        onHourChange={controls.handleHourChange}
        title={t('Total Accounts Growth')}
      />
      <Card variant="secondary">
        {isInitialLoading ? (
          <Skeleton h={{ base: '250px', md: '300px' }} rounded="xl" />
        ) : (
          <AccountGrowthInnerChart data={growthDataPoints} selectedRange={controls.selectedRange} />
        )}
      </Card>
    </Card>
  )
}

const useAccountChartControls = (genesisTimestamp: number | null, defaultRange: TimeRangeKey = 'all') => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>(defaultRange)
  const [_selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLiveMode, setIsLiveMode] = useState(true)
  const selectedDate = isLiveMode ? new Date() : _selectedDate
  const genesisDate = genesisTimestamp === null ? null : new Date(genesisTimestamp * 1000)

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setIsLiveMode(false)
  }

  const handleResetToNow = () => {
    setSelectedDate(new Date())
    setSelectedRange(defaultRange)
    setIsLiveMode(true)
  }

  const handleNavigateBack = () => {
    const rangeConfig = TIME_RANGES[selectedRange]
    setSelectedDate(rangeConfig.sub(selectedDate, 1))
    setIsLiveMode(false)
  }

  const handleNavigateForward = () => {
    const rangeConfig = TIME_RANGES[selectedRange]
    const newDate = rangeConfig.add(selectedDate, 1)
    const now = new Date()

    if (newDate <= now) {
      setSelectedDate(newDate)
      setIsLiveMode(false)
    }
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateStr = event.target.value
    if (!selectedDateStr) return

    let newSelectedDate: Date

    if (selectedRange === 'yearly' && selectedDateStr.match(/^\d{4}$/)) {
      const year = parseInt(selectedDateStr, 10)
      const now = new Date()
      if (Number.isNaN(year) || year < 2018 || year > now.getFullYear()) return
      newSelectedDate = new Date(`${year}-01-01T00:00:00`)
    } else if (selectedRange === 'monthly' && selectedDateStr.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = selectedDateStr.split('-').map(Number)
      newSelectedDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    } else if (selectedDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = selectedDateStr.split('-').map(Number)
      if (selectedRange === 'hourly') {
        newSelectedDate = new Date(year, month - 1, day, selectedDate.getHours(), 0, 0, 0)
      } else {
        newSelectedDate = new Date(year, month - 1, day, 0, 0, 0, 0)
      }
    } else {
      return
    }

    const now = new Date()
    const periodEnd = TIME_RANGES[selectedRange].endOf(newSelectedDate)

    if (
      Number.isNaN(newSelectedDate.getTime()) ||
      newSelectedDate > now ||
      (genesisDate !== null && periodEnd.getTime() < genesisDate.getTime())
    ) {
      return
    }

    setSelectedDate(newSelectedDate)
    setIsLiveMode(false)
  }

  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hour = parseInt(event.target.value, 10)
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return

    const newSelectedDate = new Date(selectedDate)
    newSelectedDate.setHours(hour, 0, 0, 0)

    if (newSelectedDate > new Date()) return

    setSelectedDate(newSelectedDate)
    setIsLiveMode(false)
  }

  return {
    selectedRange,
    selectedDate,
    isLiveMode,
    handleRangeChange,
    handleResetToNow,
    handleNavigateBack,
    handleNavigateForward,
    handleDateChange,
    handleHourChange,
  }
}

const formatSignedNumber = (
  value: number,
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string,
  options?: Intl.NumberFormatOptions,
) => `${value > 0 ? '+' : ''}${formatNumber(value, options)}`

const useAccountChartXAxisFormatter = (selectedRange: TimeRangeKey) =>
  useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp)

      switch (selectedRange) {
        case 'hourly':
        case 'daily':
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        case 'weekly': {
          const day = date.getDate()
          const month = date.toLocaleDateString(undefined, { month: 'short' })
          return `${month} ${day}${getOrdinalSuffix(day)}`
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

const getTooltipDateOptions = (selectedRange: TimeRangeKey): Intl.DateTimeFormatOptions =>
  selectedRange === 'hourly' || selectedRange === 'daily' || selectedRange === 'weekly'
    ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' }

const AccountTotalsInnerChart = ({
  data,
  selectedRange,
}: {
  data: AccountTotalsDataPoint[]
  selectedRange: TimeRangeKey
}) => {
  const formatNumber = useFormatNumber()
  const chartHeight = useBreakpointValue({ base: '250px', md: '300px' })

  const formatYAxisTick = useCallback(
    (value: number) => formatNumber(value, { notation: 'compact', maximumFractionDigits: 1 }),
    [formatNumber],
  )
  const formatXAxis = useAccountChartXAxisFormatter(selectedRange)

  return (
    <Box h={chartHeight}>
      <ResponsiveContainer>
        <AreaChart style={{ height: chartHeight }} margin={{ top: 8, right: 8, bottom: -8, left: 0 }} data={data}>
          <defs>
            <linearGradient id="accountTotalsGradient" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="totalAccounts"
            tickFormatter={formatYAxisTick}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
            stroke="white"
          />
          <Tooltip
            contentStyle={{ fontSize: '.8rem' }}
            content={(props: TooltipContentProps) => <AccountTotalsTooltip {...props} selectedRange={selectedRange} />}
          />
          <Area
            type="monotone"
            dataKey="totalAccounts"
            stroke={CHART_COLOR}
            strokeWidth={2}
            fill="url(#accountTotalsGradient)"
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

const AccountGrowthInnerChart = ({
  data,
  selectedRange,
}: {
  data: AccountGrowthDataPoint[]
  selectedRange: TimeRangeKey
}) => {
  const formatNumber = useFormatNumber()
  const chartHeight = useBreakpointValue({ base: '250px', md: '300px' })
  const formatXAxis = useAccountChartXAxisFormatter(selectedRange)
  const formatYAxisTick = useCallback(
    (value: number) => formatSignedNumber(value, formatNumber, { notation: 'compact', maximumFractionDigits: 1 }),
    [formatNumber],
  )

  return (
    <Box h={chartHeight}>
      <ResponsiveContainer>
        <BarChart style={{ height: chartHeight }} margin={{ top: 8, right: 8, bottom: -8, left: 0 }} data={data}>
          <defs>
            <linearGradient id="accountGrowthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GROWTH_CHART_COLOR} stopOpacity={0.8} />
              <stop offset="95%" stopColor={GROWTH_CHART_COLOR} stopOpacity={0.4} />
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
            dataKey="accountGrowth"
            tickFormatter={formatYAxisTick}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
            stroke="white"
          />
          <Tooltip
            contentStyle={{ fontSize: '.8rem' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            content={(props: TooltipContentProps) => <AccountGrowthTooltip {...props} selectedRange={selectedRange} />}
          />
          <Bar dataKey="accountGrowth" fill="url(#accountGrowthGradient)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

const AccountTotalsTooltip = ({
  active,
  payload,
  selectedRange,
}: TooltipContentProps & { selectedRange: TimeRangeKey }) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatNumber = useFormatNumber()
  const isVisible = active && payload && payload.length > 0

  if (!isVisible) return null

  const dataPoint = payload[0].payload as AccountTotalsDataPoint
  const dateOptions = getTooltipDateOptions(selectedRange)

  return (
    <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Date')}:
        </Text>
        <Text fontSize="sm">{formatDate(dataPoint.timestamp, dateOptions)}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Total Accounts')}:
        </Text>
        <Text fontSize="sm">{formatNumber(dataPoint.totalAccounts)}</Text>
      </Flex>
    </Stack>
  )
}

const AccountGrowthTooltip = ({
  active,
  payload,
  selectedRange,
}: TooltipContentProps & { selectedRange: TimeRangeKey }) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatNumber = useFormatNumber()
  const isVisible = active && payload && payload.length > 0

  if (!isVisible) return null

  const dataPoint = payload[0].payload as AccountGrowthDataPoint

  return (
    <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Date')}:
        </Text>
        <Text fontSize="sm">{formatDate(dataPoint.timestamp, getTooltipDateOptions(selectedRange))}</Text>
      </Flex>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Total Accounts Growth')}:
        </Text>
        <Text fontSize="sm">{formatSignedNumber(dataPoint.accountGrowth, formatNumber)}</Text>
      </Flex>
    </Stack>
  )
}

const useAccountTotalsChartData = (
  range: TimeRangeKey,
  date: Date,
  isLiveMode: boolean = true,
  genesisTimestamp: number | null = null,
) => {
  const now = new Date()
  const rangeConfig = range === 'all' ? null : TIME_RANGES[range]
  const minimumTimestamp = genesisTimestamp ?? 0

  const rawStartTimestamp =
    rangeConfig === null
      ? minimumTimestamp
      : Math.min(getUnixTime(rangeConfig.startOf(date)), getUnixTime(rangeConfig.sub(now, 1)))

  const startTimestamp = genesisTimestamp === null ? rawStartTimestamp : Math.max(minimumTimestamp, rawStartTimestamp)
  const endTimestamp =
    rangeConfig === null ? getUnixTime(now) : Math.min(getUnixTime(rangeConfig.endOf(date)), getUnixTime(now))

  const canGoBack =
    rangeConfig !== null &&
    (genesisTimestamp === null || getUnixTime(rangeConfig.endOf(rangeConfig.sub(date, 1))) >= minimumTimestamp)
  const canGoForward = rangeConfig !== null && rangeConfig.add(date, 1) <= now

  const { data: accountTotals = [], isPending } = useAccountTotals(startTimestamp, endTimestamp, isLiveMode)

  const dataPoints: AccountTotalsDataPoint[] = useMemo(
    () =>
      accountTotals
        .filter(point => point.blockTimestamp >= startTimestamp && point.blockTimestamp <= endTimestamp)
        .map(point => ({
          timestamp: point.blockTimestamp * 1000,
          totalAccounts: point.totalAccounts,
        })),
    [accountTotals, endTimestamp, startTimestamp],
  )

  return { dataPoints, canGoBack, canGoForward, isPending }
}
