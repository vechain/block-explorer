'use client'

import { Box, Button, createListCollection, Flex, IconButton, Input, Portal, Select } from '@chakra-ui/react'
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
import { LuChevronLeft, LuChevronRight, LuClock, LuRotateCcw } from 'react-icons/lu'

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
  onHourChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
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
  onHourChange,
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

  // Get hour value for hourly view
  const getHourInputValue = () => {
    if (!selectedDate) return '0'
    return String(selectedDate.getHours()).padStart(2, '0')
  }

  // Get the appropriate input width based on range
  const getDateInputWidth = () => {
    switch (selectedRange) {
      case 'yearly':
        return '100px' // Narrower for just a year number
      case 'monthly':
        return '160px' // Wider to accommodate "December 2024"
      default:
        return '140px' // Default width for date inputs
    }
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
    <Flex align="center" gap={2} flexShrink={0} flexWrap={{ base: 'wrap', md: 'nowrap' }} flex={{ base: '1', md: '0' }}>
      {/* Time Navigation Controls */}
      {selectedRange !== 'all' && (
        <>
          <IconButton
            aria-label="Go back one period"
            size="sm"
            variant="outline"
            onClick={onNavigateBack}
            disabled={!canGoBack}>
            <LuChevronLeft />
          </IconButton>

          {selectedRange === 'hourly' ? (
            <Flex align="center" gap={1} flexWrap="nowrap">
              <Input
                type="date"
                value={getDateInputValue()}
                max={new Date().toISOString().split('T')[0]}
                onChange={onDateChange}
                size="sm"
                width={{ base: '130px', sm: '140px' }}
              />
              <Box position="relative" width={{ base: '75px', sm: '85px' }} flexShrink={0}>
                <Input
                  type="number"
                  value={getHourInputValue()}
                  min={0}
                  max={23}
                  onChange={onHourChange}
                  size="sm"
                  paddingRight="32px"
                  placeholder="Hr"
                  css={{
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '&[type=number]': {
                      MozAppearance: 'textfield',
                    },
                  }}
                />
                <Box
                  position="absolute"
                  right="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  zIndex={1}
                  color="fg.muted">
                  <LuClock size={16} />
                </Box>
              </Box>
            </Flex>
          ) : (
            <Input {...getDateInputProps()} size="sm" width={getDateInputWidth()} />
          )}

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
        </>
      )}

      <Select.Root
        collection={timeRangeCollection}
        value={[selectedRange]}
        onValueChange={details => onRangeChange(details.value[0] as TimeRangeKey)}
        size="sm"
        variant="outline"
        width={'100px'}>
        <Select.Trigger>
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
