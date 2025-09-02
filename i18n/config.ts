export enum Locale {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
}

export const i18nConfig = {
  locales: Object.values(Locale),
  defaultLocale: Locale.EN,
}
