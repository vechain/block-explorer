'use client'

import { Box, Circle, Flex, Heading, Image, Link, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { Card } from '@/components/ui/Card'
import { CopyableLink } from '@/components/ui/Links'
import { DataTable, type CellComponentProps, type Column, type TableRow } from '@/components/ui/Table'
import { useFormatCompactCurrency, useFormatCurrency, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenPrices } from '@/hooks/useTokenPrices'
import { getTokenIconUrl, getTokenRegistryEntries, type TokenRegistryEntry } from '@/lib/constants/token-registry'
import { TOKEN_API_SLUGS, TokenSymbol } from '@/lib/constants/tokens'
import { useSettingsStore } from '@/lib/stores/settings'
import type { AddressString } from '@/lib/schemas'
import { truncateAddress } from '@/lib/utils/address'
import { getTokenIconPath } from '@/lib/utils/tokens'

const PRICE_IDS = Array.from(new Set(Object.values(TOKEN_API_SLUGS)))
const TOKEN_PRIORITY = [TokenSymbol.VET, TokenSymbol.VTHO, TokenSymbol.B3TR, TokenSymbol.VOT3] as const

const VET_ENTRY: TokenRegistryEntry = {
  name: 'VeChain',
  symbol: TokenSymbol.VET,
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  desc: 'VET is the native token of the VeChainThor blockchain.',
  icon: '',
  website: 'https://www.vechain.org/',
}

type TokenRowData = TableRow & {
  name: string
  symbol: string
  address: string
  website: string
  icon: string
  price: number
  marketCap: number
  totalSupply: number
  isMarketDataPending: boolean
  isTotalSupplyPending: boolean
}

const getPriorityRank = (symbol: string) =>
  TOKEN_PRIORITY.indexOf(symbol.toUpperCase() as (typeof TOKEN_PRIORITY)[number])

const getPriceSlug = (symbol: string) => {
  const normalizedSymbol = symbol.toUpperCase()
  if (normalizedSymbol in TOKEN_API_SLUGS) {
    return TOKEN_API_SLUGS[normalizedSymbol as keyof typeof TOKEN_API_SLUGS]
  }
  return undefined
}

const getPriceFormatOptions = (price: number): Intl.NumberFormatOptions => {
  if (price >= 1) {
    return { minimumFractionDigits: 2, maximumFractionDigits: 4 }
  }

  if (price >= 0.01) {
    return { minimumFractionDigits: 4, maximumFractionDigits: 4 }
  }

  return { minimumFractionDigits: 4, maximumFractionDigits: 6 }
}

const getRegistryTotalSupply = (token: TokenRegistryEntry) => {
  if (!token.totalSupply || token.totalSupply === 'Infinite') return undefined

  try {
    const totalSupply = Number(formatUnits(BigInt(token.totalSupply), token.decimals))
    return Number.isFinite(totalSupply) ? totalSupply : undefined
  } catch {
    return undefined
  }
}

const extractDomain = (url?: string) => {
  if (!url) return '-'

  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function TokensPage() {
  const { t } = useTranslation()
  const activeNetwork = useSettingsStore(state => state.activeNetwork)
  const { data: priceMap, isLoading } = useTokenPrices(PRICE_IDS)

  const rows = useMemo<TokenRowData[]>(() => {
    const registryTokens = getTokenRegistryEntries(activeNetwork.name)
    const allTokens = [VET_ENTRY, ...registryTokens]

    return allTokens
      .map(token => {
        const normalizedSymbol = token.symbol.toUpperCase()
        const priceSlug = getPriceSlug(token.symbol)
        const priceData = priceSlug ? priceMap.get(priceSlug) : undefined
        const registryTotalSupply = getRegistryTotalSupply(token)
        const icon = getTokenIconPath(token.symbol) ?? getTokenIconUrl(token.icon) ?? ''
        const totalSupply =
          normalizedSymbol === TokenSymbol.VOT3 ? registryTotalSupply : (priceData?.totalSupply ?? registryTotalSupply)
        const isCoreTokenWithApiSupply = Boolean(priceSlug) && normalizedSymbol !== TokenSymbol.VOT3

        return {
          id: token.address,
          name: token.name,
          symbol: token.symbol,
          address: token.address,
          website: token.website ?? '',
          icon,
          price: priceData?.price ?? -1,
          marketCap: priceData?.marketCap ?? -1,
          totalSupply: totalSupply ?? -1,
          isMarketDataPending: Boolean(priceSlug) && isLoading,
          isTotalSupplyPending: isCoreTokenWithApiSupply && isLoading,
        }
      })
      .sort((a, b) => {
        if (a.marketCap !== b.marketCap) {
          return b.marketCap - a.marketCap
        }

        const aPriority = getPriorityRank(a.symbol)
        const bPriority = getPriorityRank(b.symbol)

        if (aPriority !== bPriority) {
          if (aPriority === -1) return 1
          if (bPriority === -1) return -1
          return aPriority - bPriority
        }

        if (a.price !== b.price) {
          return b.price - a.price
        }

        return a.name.localeCompare(b.name)
      })
  }, [activeNetwork.name, isLoading, priceMap])

  const columns = useMemo<Column<TokenRowData>[]>(
    () => [
      { key: 'name', label: t('Name'), Cell: NameCell },
      { key: 'symbol', label: t('Symbol') },
      { key: 'marketCap', label: t('Market Cap'), Cell: MarketCapCell },
      { key: 'price', label: t('Price'), Cell: PriceCell },
      { key: 'totalSupply', label: t('Total Supply'), Cell: TotalSupplyCell },
      { key: 'address', label: t('Address'), Cell: AddressCell },
      { key: 'website', label: t('Website'), Cell: WebsiteCell },
    ],
    [t],
  )

  return (
    <Stack gap={8} mt={8}>
      <Card>
        <Heading as="h2" textStyle="displayXs">
          {t('Tokens')}
        </Heading>
        <Box minHeight="400px">
          <DataTable columns={columns} rows={rows} />
        </Box>
      </Card>
    </Stack>
  )
}

const NameCell = ({ row }: CellComponentProps<TokenRowData>) => (
  <Flex alignItems="center" gap={2}>
    <Circle size="6" overflow="hidden" flexShrink={0}>
      {row.icon ? (
        <Image src={row.icon} alt={row.name} boxSize="24px" borderRadius="full" />
      ) : (
        <Box bg="bg-alt-primary" w="full" h="full" borderRadius="full" />
      )}
    </Circle>
    <Text color="text-primary" truncate>
      {row.name}
    </Text>
  </Flex>
)

const PriceCell = ({ row }: CellComponentProps<TokenRowData>) => {
  const formatCurrency = useFormatCurrency()

  if (row.isMarketDataPending) {
    return <Skeleton height="16px" width="72px" />
  }

  if (row.price <= 0) {
    return <Text color="text-secondary">-</Text>
  }

  return <Text color="text-primary">{formatCurrency(row.price, getPriceFormatOptions(row.price))}</Text>
}

const MarketCapCell = ({ row }: CellComponentProps<TokenRowData>) => {
  const formatCompactCurrency = useFormatCompactCurrency()

  if (row.isMarketDataPending) {
    return <Skeleton height="16px" width="84px" />
  }

  if (row.marketCap <= 0) {
    return <Text color="text-secondary">-</Text>
  }

  return <Text color="text-primary">{formatCompactCurrency(row.marketCap)}</Text>
}

const TotalSupplyCell = ({ row }: CellComponentProps<TokenRowData>) => {
  const formatNumber = useFormatNumber()

  if (row.isTotalSupplyPending) {
    return <Skeleton height="16px" width="84px" />
  }

  if (row.totalSupply <= 0) {
    return <Text color="text-secondary">-</Text>
  }

  return (
    <Text color="text-primary">
      {formatNumber(row.totalSupply, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 })}
    </Text>
  )
}

const AddressCell = ({ row }: CellComponentProps<TokenRowData>) => {
  const address = row.address as AddressString

  return (
    <CopyableLink href={`/address/${address}`} value={address}>
      {truncateAddress(address)}
    </CopyableLink>
  )
}

const WebsiteCell = ({ row }: CellComponentProps<TokenRowData>) => {
  if (!row.website) {
    return <Text color="text-secondary">-</Text>
  }

  return (
    <Link
      href={row.website}
      target="_blank"
      rel="noopener noreferrer"
      color="text-alt-secondary"
      textDecoration="underline"
      textUnderlineOffset="1px"
    >
      {extractDomain(row.website)}
    </Link>
  )
}
