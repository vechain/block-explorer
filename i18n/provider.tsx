'use client'

import { createInstance } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18nInit from '.'
import type { Locale } from './config'

// A year, matching what next-i18n-router set before the CDN took over the routing.
const LOCALE_COOKIE_MAX_AGE = 31536000

export function TranslationsProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const [isReady, setIsReady] = useState(false)

  // The CDN reads this to route an unprefixed path, and cannot set it: a Set-Cookie on a
  // document it caches would hand one visitor's language to the next.
  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
  }, [locale])

  // Create a new i18n instance when locale changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const i18n = useMemo(() => createInstance(), [locale])

  useEffect(() => {
    let cancelled = false
    setIsReady(false)

    const init = async () => {
      await i18nInit({ locale, i18nInstance: i18n })
      if (!cancelled) {
        setIsReady(true)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [locale, i18n])

  // Don't render children until i18n is initialized
  if (!isReady) {
    return null
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
