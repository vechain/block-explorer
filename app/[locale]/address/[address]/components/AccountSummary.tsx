'use client'

import { Flex, Grid, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/hooks'
import { useAccountErc20Contracts } from '@/services/veworld-indexer/hooks'
import { useAccount } from '@/services/thor/hooks'
import { useErc20Contracts, erc20BalanceOfQueryOptions } from '@/services/thor/tokens/erc20'
import { useQueries } from '@tanstack/react-query'
import { formatDateFromTimestamp } from '@/lib/utils/date'
import { formatAmount } from '@/lib/utils/units'
import { isNotNullish } from '@/lib/type-predicates'
import { tokenDailyPricesQueryOptions } from '@/hooks/useTokenDailyPrices'
import { useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import {
  NATIVE_TOKEN_DECIMALS,
  MAX_TOKENS_PER_ACCOUNT,
  KNOWN_TOKEN_SYMBOLS,
  TOKEN_API_SLUGS,
} from '@/lib/constants/tokens'
import type { TokenDailyPricesToken } from '@/hooks/useTokenDailyPrices'

// Helper to get token icon path
const getTokenIconPath = (symbol: string): string | undefined => {
  const normalizedSymbol = symbol.toUpperCase()
  if (KNOWN_TOKEN_SYMBOLS.includes(normalizedSymbol as (typeof KNOWN_TOKEN_SYMBOLS)[number])) {
    return `/tokens/${normalizedSymbol}.svg`
  }
  return undefined
}

// Map token symbols to API slugs for useTokenDailyPrices
const getTokenSlug = (symbol: string): TokenDailyPricesToken => {
  const normalizedSymbol = symbol.toUpperCase()
  if (normalizedSymbol in TOKEN_API_SLUGS) {
    return TOKEN_API_SLUGS[normalizedSymbol as keyof typeof TOKEN_API_SLUGS]
  }
  return symbol.toLowerCase()
}

// Component to render a single token row with balance
const TokenBalanceRow = ({
  token,
  balance,
  isFirst,
  isLast,
}: {
  token: { symbol: string; decimals: number }
  balance: bigint | null | undefined
  isFirst: boolean
  isLast: boolean
}) => {
  const [formatted] = formatAmount({ amount: balance ?? BigInt(0), decimals: token.decimals })
  const iconPath = getTokenIconPath(token.symbol)

  const borderProps = isFirst
    ? { borderWidth: '1px', borderTopRadius: 'md' as const }
    : isLast
      ? { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomRadius: 'md' as const }
      : { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px' }

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      pt={4}
      pr={6}
      pb={4}
      pl={6}
      borderColor="border-primary"
      {...borderProps}
    >
      <Text textStyle="bodyM" color="text-primary">
        {token.symbol}
      </Text>
      <Flex alignItems="center" gap={2}>
        <Text textStyle="bodyM" color="text-primary">
          {formatted}
        </Text>
        {iconPath && <Image src={iconPath} alt={token.symbol} width={16} height={16} />}
      </Flex>
    </Flex>
  )
}

// Component to render a single token row with value
const TokenValueRow = ({
  token,
  value,
  isFirst,
  isLast,
}: {
  token: { symbol: string }
  value: string
  isFirst: boolean
  isLast: boolean
}) => {
  const iconPath = getTokenIconPath(token.symbol)

  const borderProps = isFirst
    ? { borderWidth: '1px', borderTopRadius: 'md' as const }
    : isLast
      ? { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomRadius: 'md' as const }
      : { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px' }

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      pt={4}
      pr={6}
      pb={4}
      pl={6}
      borderColor="border-primary"
      {...borderProps}
    >
      <Text textStyle="bodyM" color="text-primary">
        {token.symbol}
      </Text>
      <Flex alignItems="center" gap={2}>
        <Text textStyle="bodyM" color="text-primary">
          {value}
        </Text>
        {iconPath && <Image src={iconPath} alt={token.symbol} width={16} height={16} />}
      </Flex>
    </Flex>
  )
}

export const AccountSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const { currency } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol
  const { data: overview, isPending: isOverviewPending } = useAccountOverview(address)
  const { data: account, isPending: isAccountPending } = useAccount(address)

  // Fetch ERC20 token addresses for this account
  const { data: tokenAddresses, isPending: isLoadingTokenAddresses } = useAccountErc20Contracts({
    params: { address, size: MAX_TOKENS_PER_ACCOUNT },
  })

  // Fetch ERC20 token metadata
  const { data: erc20Map, isPending: isPendingTokenContracts } = useErc20Contracts({
    contractAddressList: new Set<AddressString>(tokenAddresses?.data ?? []),
  })

  const isPending = isOverviewPending || isAccountPending || isLoadingTokenAddresses || isPendingTokenContracts

  // API returns Unix timestamp in seconds, convert to milliseconds for Date
  const firstSeenDate = overview ? formatDateFromTimestamp(overview.firstSeen * 1000) : ''
  const lastSeenDate = overview ? formatDateFromTimestamp(overview.lastSeen * 1000) : ''

  // Fetch balances for all ERC20 tokens
  const erc20s = Array.from(erc20Map?.values() ?? []).filter(isNotNullish)
  const erc20BalanceQueries = useQueries({
    queries: erc20s.map(erc20 => erc20BalanceOfQueryOptions(erc20.contract, address)),
  })

  const isPendingBalances = erc20BalanceQueries.some(query => query.isPending)
  const isPendingAll = isPending || isPendingBalances

  // Create a map of token address to balance for quick lookup
  const erc20BalanceMap = useMemo(() => {
    const balanceMap = new Map<AddressString, bigint | null | undefined>()
    erc20s.forEach((erc20, index) => {
      balanceMap.set(erc20.address, erc20BalanceQueries[index]?.data)
    })
    return balanceMap
  }, [erc20s, erc20BalanceQueries])

  // Build token balance rows: VET and VTHO first, then ERC20 tokens
  const tokenBalanceRows = useMemo(() => {
    const rows: Array<{ symbol: string; decimals: number; balance: bigint | null | undefined; key: string }> = []

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

    // Add all ERC20 tokens (excluding VET/VTHO if they appear as ERC20)
    erc20s.forEach(erc20 => {
      // Skip if already added as native tokens
      if (erc20.symbol.toUpperCase() === 'VET' || erc20.symbol.toUpperCase() === 'VTHO') {
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

  // Fetch prices for all tokens using useTokenDailyPrices
  const tokenPriceQueries = useQueries({
    queries:
      tokenBalanceRows.length > 0
        ? tokenBalanceRows.map(token => tokenDailyPricesQueryOptions(getTokenSlug(token.symbol), currency))
        : [],
  })

  const isPendingPrices = tokenPriceQueries.some(query => query.isPending)
  const isPendingAllWithPrices = isPendingAll || isPendingPrices

  // Build token value rows: calculate value from balance * price
  const { tokenValueRows, totalValue } = useMemo(() => {
    let total = 0
    let hasError = false

    const rows = tokenBalanceRows.map((token, index) => {
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
  }, [tokenBalanceRows, tokenPriceQueries, currencySymbol])

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Account')}
          </Heading>
          <IDChip value={address} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          <DataCard
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('First Seen')}
            tooltip={t('Information coming soon')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {firstSeenDate}
              </Text>
            )}
          </DataCard>

          <DataCard
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('Last Seen')}
            tooltip={t('Information coming soon')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {lastSeenDate}
              </Text>
            )}
          </DataCard>

          <DataCard
            icon={<Image src="/icons/transaction.svg" alt="Transactions" />}
            title={t('Total Transactions')}
            tooltip={t('Information coming soon')}
            pb={0}
          >
            {isPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary" mb={0}>
                {overview?.transactionsSent.toLocaleString() ?? '0'}
              </Text>
            )}
          </DataCard>

          <DataCard
            icon={<Image src="/icons/clause.svg" alt="Clauses" />}
            title={t('Total Clauses')}
            tooltip={t('Information coming soon')}
            pb={0}
          >
            {isPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary" mb={0}>
                {overview?.clausesSent.toLocaleString() ?? '0'}
              </Text>
            )}
          </DataCard>
        </Flex>

        <Card variant="secondary" borderRadius="md" mt={4}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 5, md: 5 }}>
            <Stack gap={0}>
              <Heading as="h3" textStyle="bodyL" mb={4} color="text-primary">
                {t('Token Balance')}
              </Heading>
              <Stack gap={0}>
                {isPendingAll ? (
                  <>
                    <Skeleton height="60px" borderRadius="md" />
                    <Skeleton height="60px" borderRadius="md" mt={2} />
                  </>
                ) : tokenBalanceRows.length === 0 ? (
                  <Flex pt={4} pr={6} pb={4} pl={6} borderWidth="1px" borderColor="border-primary" borderRadius="md">
                    <Text textStyle="bodyM" color="text-primary">
                      {t('No tokens')}
                    </Text>
                  </Flex>
                ) : (
                  tokenBalanceRows.map((token, index) => (
                    <TokenBalanceRow
                      key={token.key}
                      token={token}
                      balance={token.balance}
                      isFirst={index === 0}
                      isLast={index === tokenBalanceRows.length - 1}
                    />
                  ))
                )}
              </Stack>
            </Stack>
            <Stack gap={0}>
              <Heading as="h3" textStyle="bodyL" mb={4} color="text-primary">
                {t('Token Value')}{' '}
                <Text as="span" color="text-secondary">
                  ({totalValue})
                </Text>
              </Heading>
              <Stack gap={0}>
                {isPendingAllWithPrices ? (
                  <>
                    <Skeleton height="60px" borderRadius="md" />
                    <Skeleton height="60px" borderRadius="md" mt={2} />
                  </>
                ) : tokenValueRows.length === 0 ? (
                  <Flex pt={4} pr={6} pb={4} pl={6} borderWidth="1px" borderColor="border-primary" borderRadius="md">
                    <Text textStyle="bodyM" color="text-primary">
                      {t('No tokens')}
                    </Text>
                  </Flex>
                ) : (
                  tokenValueRows.map((token, index) => (
                    <TokenValueRow
                      key={token.key}
                      token={token}
                      value={token.value}
                      isFirst={index === 0}
                      isLast={index === tokenValueRows.length - 1}
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </Grid>
        </Card>
      </Card>
    </Stack>
  )
}
