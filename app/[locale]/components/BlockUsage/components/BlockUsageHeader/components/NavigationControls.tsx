'use client'

import { IconButton, Input } from '@chakra-ui/react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import type { TimeRangeKey } from '../../../constants'
import { HourlyDateInput } from './HourlyDateInput'

interface NavigationControlsProps {
  selectedRange: TimeRangeKey
  selectedDate: Date | null
  canGoBack: boolean
  canGoForward: boolean
  onNavigateBack: () => void
  onNavigateForward: () => void
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onHourChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

// Format date for the date input based on selected range
const getDateInputValue = (selectedDate: Date | null, selectedRange: TimeRangeKey): string => {
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
const getHourInputValue = (selectedDate: Date | null): string => {
  if (!selectedDate) return '0'
  return String(selectedDate.getHours()).padStart(2, '0')
}

// Get the appropriate input width based on range
const getDateInputWidth = (selectedRange: TimeRangeKey): string => {
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
const getDateInputProps = (
  selectedDate: Date | null,
  selectedRange: TimeRangeKey,
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
) => {
  const now = new Date()

  switch (selectedRange) {
    case 'yearly':
      return {
        type: 'number' as const,
        placeholder: 'Year',
        min: 2018,
        max: now.getFullYear(),
        value: getDateInputValue(selectedDate, selectedRange),
        onChange: onDateChange,
      }
    case 'monthly':
      return {
        type: 'month' as const,
        value: getDateInputValue(selectedDate, selectedRange),
        max: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        onChange: onDateChange,
      }
    default:
      return {
        type: 'date' as const,
        value: getDateInputValue(selectedDate, selectedRange),
        max: now.toISOString().split('T')[0],
        onChange: onDateChange,
      }
  }
}

export const NavigationControls = ({
  selectedRange,
  selectedDate,
  canGoBack,
  canGoForward,
  onNavigateBack,
  onNavigateForward,
  onDateChange,
  onHourChange,
}: NavigationControlsProps) => {
  const now = new Date()

  return (
    <>
      <IconButton
        aria-label="Go back one period"
        size="sm"
        variant="outline"
        onClick={onNavigateBack}
        disabled={!canGoBack}
      >
        <LuChevronLeft />
      </IconButton>

      {selectedRange === 'hourly' ? (
        <HourlyDateInput
          dateValue={getDateInputValue(selectedDate, selectedRange)}
          hourValue={getHourInputValue(selectedDate)}
          maxDate={now.toISOString().split('T')[0]}
          onDateChange={onDateChange}
          onHourChange={onHourChange}
        />
      ) : (
        <Input
          {...getDateInputProps(selectedDate, selectedRange, onDateChange)}
          size="sm"
          width={getDateInputWidth(selectedRange)}
        />
      )}

      <IconButton
        aria-label="Go forward one period"
        size="sm"
        variant="outline"
        onClick={onNavigateForward}
        disabled={!canGoForward}
      >
        <LuChevronRight />
      </IconButton>
    </>
  )
}
