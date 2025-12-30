import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/hooks'
import { useAccountErc20Contracts } from '@/services/veworld-indexer/hooks'
import { useErc20Contracts, erc20BalanceOfQueryOptions } from '@/services/thor/tokens/erc20'
import { tokenDailyPricesQueryOptions } from '@/hooks/useTokenDailyPrices'
import { useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import { NATIVE_TOKEN_DECIMALS, MAX_TOKENS_PER_ACCOUNT } from '@/lib/constants/tokens'
import { isNotNullish } from '@/lib/type-predicates'
import { formatAmount } from '@/lib/utils/units'
import { getTokenSlug } from '@/lib/utils/tokens'

export type TokenBalanceRow = {
  symbol: string
  decimals: number
  balance: bigint | null | undefined
  key: string
}

export type TokenValueRow = {
  symbol: string
  value: string
  key: string
}

export const useAccountTokens = (address: AddressString) => {
  const { currency } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol

  const { data: account, isPending: isAccountPending } = useAccount(address)

  // Fetch ERC20 token addresses for this account
  const { data: tokenAddresses, isPending: isLoadingTokenAddresses } = useAccountErc20Contracts({
    params: { address, size: MAX_TOKENS_PER_ACCOUNT },
  })

  // Fetch ERC20 token metadata
  const { data: erc20Map, isPending: isPendingTokenContracts } = useErc20Contracts({
    contractAddressList: new Set<AddressString>(tokenAddresses?.data ?? []),
  })

  const isPendingMetadata = isAccountPending || isLoadingTokenAddresses || isPendingTokenContracts

  // Fetch balances for all ERC20 tokens
  const erc20s = Array.from(erc20Map?.values() ?? []).filter(isNotNullish)
  const erc20BalanceQueries = useQueries({
    queries: erc20s.map(erc20 => erc20BalanceOfQueryOptions(erc20.contract, address)),
  })

  const isPendingBalances = erc20BalanceQueries.some(query => query.isPending)

  // Create a map of token address to balance for quick lookup
  const erc20BalanceMap = useMemo(() => {
    const balanceMap = new Map<AddressString, bigint | null | undefined>()
    erc20s.forEach((erc20, index) => {
      balanceMap.set(erc20.address, erc20BalanceQueries[index]?.data)
    })
    return balanceMap
  }, [erc20s, erc20BalanceQueries])

  // Build token balance rows: VET, VTHO, and B3TR first (in that order), then other ERC20 tokens
  const tokenBalanceRows = useMemo((): TokenBalanceRow[] => {
    const rows: TokenBalanceRow[] = []

    // Always add VET first
    if (account?.vet !== undefined) {
      rows.push({
        symbol: 'VET',
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vet,
        key: 'VET',
      })
    }

    // Always add VTHO second
    if (account?.vtho !== undefined) {
      rows.push({
        symbol: 'VTHO',
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vtho,
        key: 'VTHO',
      })
    }

    // Always add B3TR third if available
    const b3trToken = erc20s.find(erc20 => erc20.symbol.toUpperCase() === 'B3TR')
    if (b3trToken) {
      const balance = erc20BalanceMap.get(b3trToken.address)
      if (balance !== undefined) {
        rows.push({
          symbol: b3trToken.symbol,
          decimals: b3trToken.decimals,
          balance,
          key: b3trToken.address,
        })
      }
    }

    // Add all other ERC20 tokens (excluding VET/VTHO/B3TR if they appear as ERC20)
    erc20s.forEach(erc20 => {
      // Skip if already added as native tokens or B3TR
      const normalizedSymbol = erc20.symbol.toUpperCase()
      if (normalizedSymbol === 'VET' || normalizedSymbol === 'VTHO' || normalizedSymbol === 'B3TR') {
        return
      }

      const balance = erc20BalanceMap.get(erc20.address)

      // Only add if balance exists and > 0
      if (balance && balance > BigInt(0)) {
        rows.push({
          symbol: erc20.symbol,
          decimals: erc20.decimals,
          balance,
          key: erc20.address, // Use address as key for ERC20 tokens to ensure uniqueness
        })
      }
    })

    return rows
  }, [account, erc20s, erc20BalanceMap])

  // Build token value rows: only VET, VTHO, and B3TR
  const tokenValueRowsData = useMemo((): TokenBalanceRow[] => {
    const rows: TokenBalanceRow[] = []

    // Add VET if available
    if (account?.vet !== undefined) {
      rows.push({
        symbol: 'VET',
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vet,
        key: 'VET',
      })
    }

    // Add VTHO if available
    if (account?.vtho !== undefined) {
      rows.push({
        symbol: 'VTHO',
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vtho,
        key: 'VTHO',
      })
    }

    // Add B3TR if available (find directly without iterating all tokens)
    const b3trToken = erc20s.find(erc20 => erc20.symbol.toUpperCase() === 'B3TR')
    if (b3trToken) {
      const balance = erc20BalanceMap.get(b3trToken.address)
      if (balance !== undefined) {
        rows.push({
          symbol: b3trToken.symbol,
          decimals: b3trToken.decimals,
          balance,
          key: b3trToken.address,
        })
      }
    }

    return rows
  }, [account, erc20s, erc20BalanceMap])

  // Fetch prices only for VET, VTHO, and B3TR
  const tokenPriceQueries = useQueries({
    queries:
      tokenValueRowsData.length > 0
        ? tokenValueRowsData.map(token => tokenDailyPricesQueryOptions(getTokenSlug(token.symbol), currency))
        : [],
  })

  const isPendingPrices = tokenPriceQueries.some(query => query.isPending)

  // Build token value rows: calculate value from balance * price
  const { tokenValueRows, totalValue } = useMemo(() => {
    let total = 0
    let hasError = false

    const rows: TokenValueRow[] = tokenValueRowsData.map((token, index) => {
      const priceQuery = tokenPriceQueries[index]
      const priceData = priceQuery?.data
      // useTokenDailyPrices returns an array, get the latest price
      const price =
        Array.isArray(priceData) && priceData.length > 0 ? priceData[priceData.length - 1]?.price : undefined

      let value: string

      if (priceQuery?.isError || !priceData || price === undefined) {
        value = 'n/a'
        hasError = true
      } else if (token.balance && price) {
        // Calculate: balance (in token units) * price (in currency per token)
        const balanceNumber = Number(formatAmount({ amount: token.balance, decimals: token.decimals })[1])
        const totalValue = balanceNumber * price
        total += totalValue
        value = `${currencySymbol}${totalValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      } else {
        value = `${currencySymbol}0.00`
      }

      return {
        symbol: token.symbol,
        value,
        key: token.key,
      }
    })

    const formattedTotal = hasError
      ? 'n/a'
      : `${currencySymbol}${total.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`

    return {
      tokenValueRows: rows,
      totalValue: formattedTotal,
    }
  }, [tokenValueRowsData, tokenPriceQueries, currencySymbol])

  return {
    tokenBalanceRows,
    tokenValueRows,
    totalValue,
    isPending: isPendingMetadata || isPendingBalances,
    isPendingPrices,
    isPendingAll: isPendingMetadata || isPendingBalances || isPendingPrices,
  }
}
