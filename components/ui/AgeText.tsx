'use client'

import { useEffect, useState } from 'react'
import { Text, type TextProps } from '@chakra-ui/react'
import { HiOutlineBolt } from 'react-icons/hi2'
import { useLocale } from '@/hooks/useLocale'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
]

function compactTimeAgo(timestamp: number, locale: string): string {
  const seconds = Math.min(0, Math.round((timestamp - Date.now()) / 1000))
  for (const [unit, threshold] of UNITS) {
    if (Math.abs(seconds) >= threshold) {
      const value = Math.round(seconds / threshold)
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' }).format(value, unit)
    }
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' }).format(seconds, 'second')
}

export const AgeText = ({ timestamp, ...props }: { timestamp: number } & TextProps) => {
  const locale = useLocale()
  const [, tick] = useState(0)

  // The label is derived, so the interval only needs to nudge a re-render.
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const text = compactTimeAgo(timestamp, locale)

  return (
    <Text color="accent-secondary" display="flex" alignItems="center" textTransform="capitalize" gap={1} {...props}>
      <HiOutlineBolt size={16} />
      {text}
    </Text>
  )
}
