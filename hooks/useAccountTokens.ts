import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/account'
import { useAccountErc20Contracts } from '@/services/veworld-indexer/erc20-contracts'
import { useErc20Contracts, erc20BalanceOfQueryOptions } from '@/services/thor/tokens/erc20'
import { tokenDailyPricesQueryOptions } from '@/hooks/useTokenDailyPrices'
import { useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import {
  NATIVE_TOKEN_DECIMALS,
  MAX_TOKENS_PER_ACCOUNT,
  TokenSymbol,
  COMBINED_TOKENS,
  isCombinedToken,
} from '@/lib/constants/tokens'
import { isNotNullish } from '@/lib/type-predicates'
import { getTokenSlug } from '@/lib/utils/tokens'
import { getTokenInfo } from '@/lib/constants/token-registry'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'

export type TokenBreakdownItem = {
  symbol: string
  balance: bigint | null | undefined
}

export type TokenBalanceRow = {
  symbol: string
  decimals: number
  balance: bigint | null | undefined
  key: string
  breakdown?: TokenBreakdownItem[]
}

export type TokenValueRow = {
  symbol: string
  value: string
  key: string
}

export const useAccountTokens = (address: AddressString) => {
  const formatNumber = useFormatNumber()
  const formatAmount = useFormatAmount()
  const { currency, activeNetwork } = useSettingsStore()
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

  // Filter ERC20 tokens to only include those in the token registry
  const registeredErc20s = useMemo(() => {
    return erc20s.filter(erc20 => getTokenInfo(activeNetwork.name, erc20.address) !== null)
  }, [erc20s, activeNetwork.name])

  // Build token balance rows: VET, VTHO, and B3TR/VOT3 first (in that order), then other ERC20 tokens
  const tokenBalanceRows = useMemo((): TokenBalanceRow[] => {
    const rows: TokenBalanceRow[] = []

    // Always add VET first
    if (account?.vet !== undefined) {
      rows.push({
        symbol: TokenSymbol.VET,
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vet,
        key: TokenSymbol.VET,
      })
    }

    // Always add VTHO second
    if (account?.vtho !== undefined) {
      rows.push({
        symbol: TokenSymbol.VTHO,
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vtho,
        key: TokenSymbol.VTHO,
      })
    }

    // Always add combined B3TR/VOT3 third if either is available
    const b3trToken = registeredErc20s.find(erc20 => erc20.symbol.toUpperCase() === TokenSymbol.B3TR)
    const vot3Token = registeredErc20s.find(erc20 => erc20.symbol.toUpperCase() === TokenSymbol.VOT3)

    if (b3trToken || vot3Token) {
      const b3trBalance = b3trToken ? erc20BalanceMap.get(b3trToken.address) : undefined
      const vot3Balance = vot3Token ? erc20BalanceMap.get(vot3Token.address) : undefined

      // Only add if at least one balance is defined
      if (b3trBalance !== undefined || vot3Balance !== undefined) {
        const combinedBalance = (b3trBalance ?? BigInt(0)) + (vot3Balance ?? BigInt(0))

        rows.push({
          symbol: COMBINED_TOKENS.primarySymbol,
          decimals: COMBINED_TOKENS.decimals,
          balance: combinedBalance,
          key: COMBINED_TOKENS.key,
          breakdown: COMBINED_TOKENS.symbols.map(symbol => ({
            symbol,
            balance: symbol === TokenSymbol.B3TR ? (b3trBalance ?? BigInt(0)) : (vot3Balance ?? BigInt(0)),
          })),
        })
      }
    }

    // Add all other ERC20 tokens (excluding priority tokens handled above)
    registeredErc20s.forEach(erc20 => {
      // Skip if already added as native tokens or combined tokens
      const normalizedSymbol = erc20.symbol.toUpperCase()
      if (
        normalizedSymbol === TokenSymbol.VET ||
        normalizedSymbol === TokenSymbol.VTHO ||
        isCombinedToken(normalizedSymbol)
      ) {
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
  }, [account, registeredErc20s, erc20BalanceMap])

  // Build token value rows: only VET, VTHO, and B3TR/VOT3 (combined)
  const tokenValueRowsData = useMemo((): TokenBalanceRow[] => {
    const rows: TokenBalanceRow[] = []

    // Add VET if available
    if (account?.vet !== undefined) {
      rows.push({
        symbol: TokenSymbol.VET,
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vet,
        key: TokenSymbol.VET,
      })
    }

    // Add VTHO if available
    if (account?.vtho !== undefined) {
      rows.push({
        symbol: TokenSymbol.VTHO,
        decimals: NATIVE_TOKEN_DECIMALS,
        balance: account.vtho,
        key: TokenSymbol.VTHO,
      })
    }

    // Add combined B3TR/VOT3 if either is available (for value calculation)
    const b3trToken = registeredErc20s.find(erc20 => erc20.symbol.toUpperCase() === TokenSymbol.B3TR)
    const vot3Token = registeredErc20s.find(erc20 => erc20.symbol.toUpperCase() === TokenSymbol.VOT3)

    if (b3trToken || vot3Token) {
      const b3trBalance = b3trToken ? erc20BalanceMap.get(b3trToken.address) : undefined
      const vot3Balance = vot3Token ? erc20BalanceMap.get(vot3Token.address) : undefined

      if (b3trBalance !== undefined || vot3Balance !== undefined) {
        const combinedBalance = (b3trBalance ?? BigInt(0)) + (vot3Balance ?? BigInt(0))

        rows.push({
          symbol: COMBINED_TOKENS.primarySymbol, // Use primary symbol for price lookup
          decimals: COMBINED_TOKENS.decimals,
          balance: combinedBalance,
          key: COMBINED_TOKENS.key,
        })
      }
    }

    return rows
  }, [account, registeredErc20s, erc20BalanceMap])

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
        const [, fullAmount] = formatAmount({ amount: token.balance, decimals: token.decimals })
        const balanceNumber = Number(fullAmount)
        const totalValue = balanceNumber * price
        total += totalValue
        value = `${currencySymbol}${formatNumber(totalValue, {
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
      : `${currencySymbol}${formatNumber(total, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`

    return {
      tokenValueRows: rows,
      totalValue: formattedTotal,
    }
  }, [tokenValueRowsData, currencySymbol, formatNumber, tokenPriceQueries, formatAmount])

  return {
    tokenBalanceRows,
    tokenValueRows,
    totalValue,
    isPending: isPendingMetadata || isPendingBalances,
    isPendingPrices,
    isPendingAll: isPendingMetadata || isPendingBalances || isPendingPrices,
  }
}
