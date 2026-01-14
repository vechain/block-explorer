import { Locale } from '@/i18n/config'

/**
 * Converts a timestamp to milliseconds if it's in seconds.
 * Unix timestamps in seconds are typically 10 digits (< 10^12),
 * while millisecond timestamps are 13 digits (>= 10^12).
 */
const toMilliseconds = (timestamp: number): number => {
  // If timestamp is less than 10^12, it's likely in seconds
  return timestamp < 1e12 ? timestamp * 1000 : timestamp
}

export const formatDateFromTimestamp = (timestamp: number, locale?: Locale, options?: Intl.DateTimeFormatOptions) => {
  return new Date(toMilliseconds(timestamp)).toLocaleString(locale || Locale.EN, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    ...options,
  })
}

export function timeFormat(timestamp: number): string {
  //* format timestamp to HH:MM:SS
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
