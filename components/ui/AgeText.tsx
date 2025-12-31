'use client'

import { Text, type TextProps } from '@chakra-ui/react'
import type { Locale as DateFnsLocale } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { de, el, enUS, es, fr, it, ja, pt, ru, tr, zhCN } from 'date-fns/locale'
import { HiOutlineBolt } from 'react-icons/hi2'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/hooks/useLocale'

const dateFnsLocales: Record<Locale, DateFnsLocale> = {
  en: enUS,
  es,
  fr,
  it,
  ja,
  pt,
  ru,
  tr,
  de,
  zh: zhCN,
  el,
}

export const AgeText = ({ timestamp, ...props }: { timestamp: number } & TextProps) => {
  const locale = useLocale()

  return (
    <Text color="accent-secondary" display="flex" alignItems="center" textTransform="capitalize" gap={1} {...props}>
      <HiOutlineBolt size={16} />
      {formatDistanceToNow(new Date(timestamp), { includeSeconds: true, locale: dateFnsLocales[locale] })}
    </Text>
  )
}
