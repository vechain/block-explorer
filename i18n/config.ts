export enum Locale {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  IT = 'it',
  JA = 'ja',
  PT = 'pt',
  RU = 'ru',
  TR = 'tr',
  DE = 'de',
  ZH = 'zh',
  EL = 'el',
}

export const i18nConfig = {
  locales: Object.values(Locale),
  defaultLocale: Locale.EN,
}
