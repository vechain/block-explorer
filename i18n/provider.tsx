'use client'

import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import i18nInit from '.'
import type { Locale } from './config'

export function TranslationsProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const i18n = createInstance()
  i18nInit({ locale, i18nInstance: i18n })

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
