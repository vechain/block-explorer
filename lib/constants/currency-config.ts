import { Currency } from '@/lib/stores/settings'

export const currencyConfig = {
  currencies: Object.values(Currency),
  defaultCurrency: Currency.USD,
  cookieName: 'NEXT_CURRENCY',
}
