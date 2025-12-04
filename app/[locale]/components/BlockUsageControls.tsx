'use client'

import { Button, createListCollection, Flex, IconButton, Input, Portal, Select } from '@chakra-ui/react'
import { LuChevronLeft, LuChevronRight, LuRotateCcw } from 'react-icons/lu'

// Time range options based on API granularity rules (in seconds)
export const TIME_RANGES = {
  hourly: { label: 'Hourly', seconds: 3600 }, // 1 hour
  daily: { label: 'Daily', seconds: 86400 }, // 1 day
  weekly: { label: 'Weekly', seconds: 604800 }, // 1 week
  monthly: { label: 'Monthly', seconds: 2592000 }, // 30 days
  yearly: { label: 'Yearly', seconds: 31536000 }, // 365 days
  all: { label: 'All Time', seconds: 0 }, // Special case - from genesis to now
} as const

export type TimeRangeKey = keyof typeof TIME_RANGES

type TimeRangeItem = { label: string; value: TimeRangeKey }

const timeRangeCollection = createListCollection<TimeRangeItem>({
  items: Object.entries(TIME_RANGES).map(([key, config]) => ({
    label: config.label,
    value: key as TimeRangeKey,
  })),
})

export interface BlockUsageControlsProps {
  selectedRange: TimeRangeKey
  currentPeriodStart: number | null
  canGoBack: boolean
  canGoForward: boolean
  onRangeChange: (newRange: TimeRangeKey) => void
  onNavigateBack: () => void
  onNavigateForward: () => void
  onResetToNow: () => void
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const BlockUsageControls = ({
  selectedRange,
  currentPeriodStart,
  canGoBack,
  canGoForward,
  onRangeChange,
  onNavigateBack,
  onNavigateForward,
  onResetToNow,
  onDateChange,
}: BlockUsageControlsProps) => {
  // Format date for the date input based on selected range
  const getDateInputValue = () => {
    if (!currentPeriodStart) return ''

    const date = new Date(currentPeriodStart)

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
          value: currentPeriodStart ? new Date(currentPeriodStart).getFullYear() : '',
          onChange: onDateChange,
        }
      case 'monthly':
        return {
          type: 'month' as const,
          value: getDateInputValue(),
          max: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          onChange: onDateChange,
        }
      default:
        return {
          type: 'date' as const,
          value: getDateInputValue(),
          max: now.toISOString().split('T')[0],
          onChange: onDateChange,
        }
    }
  }

  return (
    <Flex align="center" gap={4} flexShrink={0}>
      {/* Time Navigation Controls */}
      {selectedRange !== 'all' && (
        <Flex align="center" gap={2}>
          <IconButton
            aria-label="Go back one period"
            size="sm"
            variant="outline"
            onClick={onNavigateBack}
            disabled={!canGoBack}>
            <LuChevronLeft />
          </IconButton>

          <Input {...getDateInputProps()} size="sm" width="140px" />

          <IconButton
            aria-label="Go forward one period"
            size="sm"
            variant="outline"
            onClick={onNavigateForward}
            disabled={!canGoForward}>
            <LuChevronRight />
          </IconButton>

          <Button size="sm" variant="outline" onClick={onResetToNow}>
            <LuRotateCcw />
            Now
          </Button>
        </Flex>
      )}

      <Select.Root
        collection={timeRangeCollection}
        value={[selectedRange]}
        onValueChange={details => onRangeChange(details.value[0] as TimeRangeKey)}
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
  )
}
