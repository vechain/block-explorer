import { i18nConfig, Locale } from './config'

export function getLocalePath(locale: Locale, pathname: string): string {
  const segments = pathname.split('/')
  // Check if the first segment after the leading slash is already a locale
  const firstSegment = segments[1]
  const isLocaleInPath = firstSegment && i18nConfig.locales.includes(firstSegment as Locale)

  if (isLocaleInPath) {
    // Replace the existing locale
    segments[1] = locale
  } else {
    // Insert the new locale at the beginning (after the leading empty string)
    segments.splice(1, 0, locale)
  }
  return segments.join('/')
}

export const languageNames: Record<Locale, { native: string; english: string; flag: string }> = {
  [Locale.EN]: { native: 'English', english: 'English', flag: '🇬🇧' },
  [Locale.ES]: { native: 'Español', english: 'Spanish', flag: '🇪🇸' },
  [Locale.FR]: { native: 'Français', english: 'French', flag: '🇫🇷' },
  [Locale.IT]: { native: 'Italiano', english: 'Italian', flag: '🇮🇹' },
  [Locale.JA]: { native: '日本語', english: 'Japanese', flag: '🇯🇵' },
  [Locale.PT]: { native: 'Português', english: 'Portuguese', flag: '🇵🇹' },
  [Locale.RU]: { native: 'Русский', english: 'Russian', flag: '🇷🇺' },
  [Locale.TR]: { native: 'Türkçe', english: 'Turkish', flag: '🇹🇷' },
  [Locale.DE]: { native: 'Deutsch', english: 'German', flag: '🇩🇪' },
  [Locale.ZH]: { native: '中文', english: 'Chinese', flag: '🇨🇳' },
  [Locale.EL]: { native: 'Ελληνικά', english: 'Greek', flag: '🇬🇷' },
}
