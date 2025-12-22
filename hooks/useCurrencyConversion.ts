import { useMemo } from 'react'
import { useSettingsStore, Currency } from '@/lib/stores/settings'
import { useGetTokenUsdPrice } from '@/hooks/useGetTokenUsdPrice'

type CurrencyMeta = {
  code: Currency
  symbol: string
}

const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  [Currency.USD]: { code: Currency.USD, symbol: '$' },
  [Currency.EUR]: { code: Currency.EUR, symbol: '€' },
  [Currency.GBP]: { code: Currency.GBP, symbol: '£' },
}

export const useCurrencyConversion = () => {
  const { currency } = useSettingsStore()

  // Oracle feeds return "1 EUR in USD" and "1 GBP in USD".
  const { data: eurUsd } = useGetTokenUsdPrice('EUR')
  const { data: gbpUsd } = useGetTokenUsdPrice('GBP')

  const meta = CURRENCY_META[currency]

  const usdToSelected = useMemo(() => {
    if (currency === Currency.USD) {
      return (usd?: number) => usd
    }

    if (currency === Currency.EUR) {
      return (usd?: number) => {
        if (usd === undefined) return undefined
        if (!eurUsd) return undefined
        return usd / eurUsd
      }
    }

    // GBP
    return (usd?: number) => {
      if (usd === undefined) return undefined
      if (!gbpUsd) return undefined
      return usd / gbpUsd
    }
  }, [currency, eurUsd, gbpUsd])

  const formatFiat = useMemo(() => {
    return (usd?: number, decimals = 4) => {
      const v = usdToSelected(usd)
      if (v === undefined) return '-'
      return `${meta.symbol}${v.toFixed(decimals)}`
    }
  }, [meta.symbol, usdToSelected])

  return {
    currency,
    currencySymbol: meta.symbol,
    usdToSelected,
    formatFiat,
    eurUsd,
    gbpUsd,
  }
}
