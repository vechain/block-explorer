'use client'

import { Button, createListCollection, Flex, Heading, IconButton, Input, Select, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LuChevronLeft, LuChevronRight, LuRotateCcw } from 'react-icons/lu'
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
import { transformBlockUsageData, type BlockUsageDataPoint } from '@/lib/utils/block-usage'
import { useBlockUsage } from '@/services/veworld-indexer/block-usage'
import { useBlock } from '@/services/thor/hooks'
import { blockRevisionEnumSchema } from '@/lib/schemas'

const width = 1000
const height = 400

// Time range options based on API granularity rules
const TIME_RANGES = {
  '6h': { label: '6 Hours', blocks: 2160, granularity: 'block' },
  '1d': { label: '1 Day', blocks: 8640, granularity: 'hourly' },
  '1w': { label: '1 Week', blocks: 60480, granularity: 'hourly' },
  '1m': { label: '1 Month', blocks: 259200, granularity: 'daily' },
  '6m': { label: '6 Months', blocks: 1555200, granularity: 'weekly' },
  '1y': { label: '1 Year', blocks: 3110400, granularity: 'weekly' },
  '2y': { label: '2 Years', blocks: 6307200, granularity: 'weekly' },
  'all': { label: 'All Time', blocks: 20000000, granularity: 'monthly' },
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
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('1d')
  const [timeOffset, setTimeOffset] = useState(0) // Number of periods to go back in time
  const { blocksDataPoints, isLoading, selectedRangeConfig, canGoBack, canGoForward, currentPeriodStart } = useBlockUsageChartData(selectedRange, timeOffset)

  if (isLoading) return <Skeleton height={height} width={width} rounded="xl" />

  const handleRangeChange = (newRange: TimeRangeKey) => {
    setSelectedRange(newRange)
    setTimeOffset(0) // Reset to current time when changing ranges
  }

  const handleTimeNavigation = (direction: 'back' | 'forward' | 'reset') => {
    switch (direction) {
      case 'back':
        if (canGoBack) setTimeOffset(prev => prev + 1)
        break
      case 'forward':
        if (canGoForward) setTimeOffset(prev => Math.max(0, prev - 1))
        break
      case 'reset':
        setTimeOffset(0)
        break
    }
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value)
    const now = new Date()
    
    // Validate the selected date
    if (isNaN(selectedDate.getTime()) || selectedDate > now) {
      return // Invalid date or future date
    }
    
    // Calculate the time difference in the appropriate units
    const timeDiffMs = now.getTime() - selectedDate.getTime()
    
    // Convert to the appropriate offset based on granularity
    let periodsBack = 0
    switch (selectedRangeConfig.granularity) {
      case 'block':
        // For block-level, each period is the full range duration
        periodsBack = Math.floor(timeDiffMs / (selectedRangeConfig.blocks * 10 * 1000)) // 10 seconds per block
        break
      case 'hourly':
        periodsBack = Math.floor(timeDiffMs / (60 * 60 * 1000)) // 1 hour periods
        break
      case 'daily':
        periodsBack = Math.floor(timeDiffMs / (24 * 60 * 60 * 1000)) // 1 day periods
        break
      case 'weekly':
        periodsBack = Math.floor(timeDiffMs / (7 * 24 * 60 * 60 * 1000)) // 1 week periods
        break
      case 'monthly':
        periodsBack = Math.floor(timeDiffMs / (30 * 24 * 60 * 60 * 1000)) // ~1 month periods
        break
    }
    
    // Ensure we don't go beyond reasonable limits
    const maxPeriodsBack = Math.floor(20000000 / selectedRangeConfig.blocks) // Based on max blockchain size
    setTimeOffset(Math.max(0, Math.min(periodsBack, maxPeriodsBack)))
  }

  // Format the current period start date for the date input
  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  return (
    <Stack flex={1} gap={4} bg="bg.muted" rounded="xl" p={8}>
      <Flex justify="space-between" align="center">
        <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
          Block Usage
        </Heading>
        
        <Flex align="center" gap={4}>
          {/* Time Navigation Controls */}
          {selectedRange !== 'all' && (
            <Flex align="center" gap={2}>
              <IconButton
                aria-label="Go back in time"
                size="sm"
                variant="outline"
                onClick={() => handleTimeNavigation('back')}
                disabled={!canGoBack}
              >
                <LuChevronLeft />
              </IconButton>
              
              <Input
                type="date"
                size="sm"
                width="140px"
                value={currentPeriodStart ? formatDateForInput(currentPeriodStart) : ''}
                onChange={handleDateChange}
                max={formatDateForInput(Date.now() / 1000)}
              />
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimeNavigation('reset')}
                disabled={timeOffset === 0}
              >
                <LuRotateCcw />
                Now
              </Button>
              
              <IconButton
                aria-label="Go forward in time"
                size="sm"
                variant="outline"
                onClick={() => handleTimeNavigation('forward')}
                disabled={!canGoForward}
              >
                <LuChevronRight />
              </IconButton>
            </Flex>
          )}
          
          <Select.Root
            collection={timeRangeCollection}
            value={[selectedRange]}
            onValueChange={(details) => handleRangeChange(details.value[0] as TimeRangeKey)}
            width="200px"
          >
            <Select.Trigger bg="bg">
              <Select.ValueText placeholder="Select time range" />
            </Select.Trigger>
            <Select.Content>
              {timeRangeCollection.items.map(item => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      <BlockUsageChart data={blocksDataPoints} granularity={selectedRangeConfig.granularity} />
    </Stack>
  )
}

const BlockUsageChart = ({ data, granularity }: { data: DataPoint[]; granularity: string }) => {
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

        <Tooltip 
          contentStyle={{ fontSize: '.8rem' }} 
          content={(props: TooltipContentProps<number, string>) => <CustomTooltip {...props} granularity={granularity} />} 
        />
        <Bar dataKey="gasUsed" fill="url(#greenToRed)" onClick={handleBarClick} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const CustomTooltip = ({ active, payload, granularity }: TooltipContentProps<number, string> & { granularity: string }) => {
  const isVisible = active && payload.length > 0

  if (!isVisible) return null

  const dataPoint = payload[0].payload as DataPoint

  // Determine labels based on granularity
  const getLabels = (granularity: string) => {
    switch (granularity) {
      case 'block':
        return {
          identifier: 'Block Number',
          gasUsed: 'Gas Used',
          gasLimit: 'Gas Limit',
          usage: 'Usage'
        }
      case 'hourly':
        return {
          identifier: 'Time Period',
          gasUsed: 'Avg Gas Used/Block',
          gasLimit: 'Avg Gas Limit/Block',
          usage: 'Avg Usage'
        }
      case 'daily':
        return {
          identifier: 'Date',
          gasUsed: 'Avg Gas Used/Block',
          gasLimit: 'Avg Gas Limit/Block',
          usage: 'Avg Usage'
        }
      case 'weekly':
        return {
          identifier: 'Week',
          gasUsed: 'Avg Gas Used/Block',
          gasLimit: 'Avg Gas Limit/Block',
          usage: 'Avg Usage'
        }
      case 'monthly':
        return {
          identifier: 'Month',
          gasUsed: 'Avg Gas Used/Block',
          gasLimit: 'Avg Gas Limit/Block',
          usage: 'Avg Usage'
        }
      default:
        return {
          identifier: 'Block Number',
          gasUsed: 'Gas Used',
          gasLimit: 'Gas Limit',
          usage: 'Usage'
        }
    }
  }

  const labels = getLabels(granularity)

  // Format the identifier value based on granularity
  const getIdentifierValue = (granularity: string, dataPoint: DataPoint) => {
    const date = new Date(dataPoint.timestamp * 1000)
    
    switch (granularity) {
      case 'block':
        return dataPoint.number.toLocaleString()
      case 'hourly':
        return date.toLocaleString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric',
          minute: '2-digit'
        })
      case 'daily':
        return date.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      case 'weekly':
        // Show week starting date
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return `Week of ${weekStart.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        })}`
      case 'monthly':
        return date.toLocaleDateString(undefined, { 
          month: 'long', 
          year: 'numeric' 
        })
      default:
        return dataPoint.number.toLocaleString()
    }
  }

  return (
    <Stack bg="bg" rounded="xl" p={4}>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {labels.identifier}:
        </Text>
        <Text fontSize="sm">{getIdentifierValue(granularity, dataPoint)}</Text>
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

const useBlockUsageChartData = (selectedRange: TimeRangeKey, timeOffset: number = 0) => {
  // Get the current best block to determine the range
  const { data: bestBlock } = useBlock(blockRevisionEnumSchema.enum.BEST)
  
  // Get the selected range configuration
  const selectedRangeConfig = TIME_RANGES[selectedRange]
  
  // Calculate the block range based on selected time range and time offset
  // Round endBlock to reduce flickering for longer time ranges
  const rawEndBlock = bestBlock?.number ?? 0
  const roundingFactor = selectedRangeConfig.granularity === 'block' ? 1 : 100
  const currentEndBlock = Math.floor(rawEndBlock / roundingFactor) * roundingFactor
  
  // Apply time offset by moving back in time by the specified number of periods
  const offsetBlocks = timeOffset * selectedRangeConfig.blocks
  const endBlock = Math.max(selectedRangeConfig.blocks, currentEndBlock - offsetBlocks)
  const startBlock = Math.max(0, endBlock - selectedRangeConfig.blocks + 1)
  
  // Calculate navigation constraints
  const canGoBack = startBlock > 0 // Can go back if we're not at the beginning of the blockchain
  const canGoForward = timeOffset > 0 // Can go forward if we're not at the current time
  
  // Fetch block usage data from indexer
  const { data: cumulativeData = [], ...rest } = useBlockUsage(startBlock, endBlock, selectedRangeConfig.granularity)
  
  // Transform cumulative data to per-block values
  const blocksDataPoints = transformBlockUsageData(cumulativeData)

  // Calculate the current period start timestamp for the date picker
  const currentPeriodStart = blocksDataPoints.length > 0 ? blocksDataPoints[0].timestamp : null

  return { blocksDataPoints, selectedRangeConfig, canGoBack, canGoForward, currentPeriodStart, ...rest }
}
