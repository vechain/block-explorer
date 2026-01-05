'use client'

import { useParams } from 'next/navigation'
import { Locale } from '@/i18n/config'

/**
 * Hook to get the current locale from the route params.
 * Returns the locale string that can be used with toLocaleString() and other i18n APIs.
 */
export const useLocale = (): Locale => {
  const params = useParams()
  return (params.locale as Locale) || Locale.EN
}
