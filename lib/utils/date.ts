import { Locale } from '@/i18n/config'

export const formatDateFromTimestamp = (timestamp: number, locale?: Locale, options?: Intl.DateTimeFormatOptions) => {
  return new Date(timestamp).toLocaleString(locale || Locale.EN, {
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
