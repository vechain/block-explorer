import { i18nConfig, type Locale } from '@/i18n/config'

const isLocale = (segment: string | undefined): segment is Locale => i18nConfig.locales.includes(segment as Locale)

/** `/es/transfers/nft` → `/es`; the default locale is unprefixed, so `/transfers/nft` → `''`. */
export const getLocalePrefix = (pathname: string): string => {
  const [first] = pathname.split('/').filter(Boolean)

  return isLocale(first) ? `/${first}` : ''
}
