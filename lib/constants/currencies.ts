import { Currency } from '@/lib/stores/settings'

type CurrencyMeta = {
  code: Currency
  symbol: string
}

export const CURRENCIES: Record<Currency, CurrencyMeta> = {
  [Currency.USD]: { code: Currency.USD, symbol: '$' },
  [Currency.EUR]: { code: Currency.EUR, symbol: '€' },
  [Currency.GBP]: { code: Currency.GBP, symbol: '£' },
  [Currency.CNY]: { code: Currency.CNY, symbol: '¥' },
  [Currency.JPY]: { code: Currency.JPY, symbol: '¥' },
  [Currency.AUD]: { code: Currency.AUD, symbol: '$' },
  [Currency.CAD]: { code: Currency.CAD, symbol: '$' },
}
