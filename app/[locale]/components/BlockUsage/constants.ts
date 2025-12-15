import { createListCollection } from '@chakra-ui/react'
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

export const timeRangeCollection = createListCollection<TimeRangeItem>({
  items: Object.entries(TIME_RANGES).map(([key, config]) => ({
    label: config.label,
    value: key as TimeRangeKey,
  })),
})
