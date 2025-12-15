'use client'

import { Text, type TextProps } from '@chakra-ui/react'
import type { Locale as DateFnsLocale } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { de, el, enUS, es, fr, it, ja, pt, ru, tr, zhCN } from 'date-fns/locale'
import { useParams } from 'next/navigation'
import { HiOutlineBolt } from 'react-icons/hi2'
import type { Locale } from '@/i18n/config'

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
  const params = useParams()
  const locale = (params.locale as Locale) || 'en'

  return (
    <Text color="highlight-secondary" display="flex" alignItems="center" textTransform="capitalize" gap={1} {...props}>
      <HiOutlineBolt size={16} />
      {formatDistanceToNow(new Date(timestamp), { includeSeconds: true, locale: dateFnsLocales[locale] })}
    </Text>
  )
}
