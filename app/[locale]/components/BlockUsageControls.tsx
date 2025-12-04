'use client'

import { Button, createListCollection, Flex, IconButton, Input, Portal, Select } from '@chakra-ui/react'
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
import { LuChevronLeft, LuChevronRight, LuRotateCcw } from 'react-icons/lu'

// Time range configuration using date-fns functions
export const TIME_RANGES = {
  hourly: {
    label: 'Hourly',
    startOf: startOfHour,
    endOf: endOfHour,
    add: addHours,
    sub: subHours,
  },
  daily: {
    label: 'Daily',
    startOf: startOfDay,
    endOf: endOfDay,
    add: addDays,
    sub: subDays,
  },
  weekly: {
    label: 'Weekly',
    startOf: startOfWeek,
    endOf: endOfWeek,
    add: addWeeks,
    sub: subWeeks,
  },
  monthly: {
    label: 'Monthly',
    startOf: startOfMonth,
    endOf: endOfMonth,
    add: addMonths,
    sub: subMonths,
  },
  yearly: {
    label: 'Yearly',
    startOf: startOfYear,
    endOf: endOfYear,
    add: addYears,
    sub: subYears,
  },
  all: {
    label: 'All Time',
    // Special case - from genesis to now, use identity/no-op functions for consistency
    startOf: (date: Date) => date,
    endOf: (date: Date) => date,
    add: (date: Date) => date,
    sub: (date: Date) => date,
  },
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
  selectedDate: Date | null
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
  selectedDate,
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
    if (!selectedDate) return ''

    // For yearly view, use year picker
    if (selectedRange === 'yearly') {
      return selectedDate.getFullYear().toString()
    }

    // For monthly view, use month picker
    if (selectedRange === 'monthly') {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    }

    // For all other views, use date picker (format in local timezone)
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
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
          value: getDateInputValue(),
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
