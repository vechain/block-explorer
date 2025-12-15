import type en from './languages/en.json'

export type TranslationKey = keyof typeof en

// Augment react-i18next types for type-safe t() function
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
