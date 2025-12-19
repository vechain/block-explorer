import { createInstance, type i18n as I18n } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next/initReactI18next'
import { i18nConfig, type Locale } from './config'

export default async function i18nInit({ locale, i18nInstance }: { locale: Locale | null; i18nInstance?: I18n }) {
  const i18n = i18nInstance ?? createInstance()

  i18n.use(initReactI18next)
  i18n.use(resourcesToBackend((lng: string) => import(`./languages/${lng}.json`)))

  await i18n.init({
    // debug: process.env.NODE_ENV === 'development',
    lng: locale ?? i18nConfig.defaultLocale,
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    // Only preload the current locale, not all of them
    //preload: typeof window === 'undefined' ? i18nConfig.locales : [],
  })

  return i18n
}
