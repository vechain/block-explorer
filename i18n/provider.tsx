'use client'

import { createInstance, type i18n as I18n } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18nInit from '.'
import type { Locale } from './config'

// Cache initialized i18n instances per locale to avoid re-initialization
const i18nCache = new Map<Locale, I18n>()

export function TranslationsProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const [isReady, setIsReady] = useState(() => i18nCache.has(locale))
  const i18nRef = useRef<I18n | null>(i18nCache.get(locale) ?? null)

  useEffect(() => {
    // If we already have a cached instance for this locale, use it
    if (i18nCache.has(locale)) {
      i18nRef.current = i18nCache.get(locale)!
      setIsReady(true)
      return
    }

    let cancelled = false
    setIsReady(false)

    const init = async () => {
      const instance = createInstance()
      await i18nInit({ locale, i18nInstance: instance })
      if (!cancelled) {
        i18nCache.set(locale, instance)
        i18nRef.current = instance
        setIsReady(true)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [locale])

  // Don't render children until i18n is initialized
  if (!isReady || !i18nRef.current) {
    return null
  }

  return <I18nextProvider i18n={i18nRef.current}>{children}</I18nextProvider>
}
