import z from 'zod'
import { i18nConfig, type Locale } from '@/i18n/config'
import { DEFAULT_NETWORK, NetworkName, NETWORKS } from '@/lib/constants/network'
import { type TransactionId, transactionIdSchema } from '@/lib/schemas'

const DEFAULT_NETWORK_NAME = DEFAULT_NETWORK.name
const AVAILABLE_NETWORK_NAMES = Object.keys(NETWORKS) as [NetworkName, ...NetworkName[]]
const networkNameSchema = z.enum(AVAILABLE_NETWORK_NAMES)

type SearchParamsLike = Pick<URLSearchParams, 'get'> | null | undefined
type SearchParamsWithToStringLike = Pick<URLSearchParams, 'toString'> | null | undefined
type SearchParamsReadable = Pick<URLSearchParams, 'get' | 'toString'> | null | undefined

let pendingManualNetworkSearchParamSync: NetworkName | null = null

export const parseNetworkName = (network?: string | null): NetworkName | null => {
  const result = networkNameSchema.safeParse(network)
  return result.success ? result.data : null
}

export const resolveNetworkName = (network?: string | null): NetworkName => {
  return parseNetworkName(network) ?? DEFAULT_NETWORK_NAME
}

export const getFallbackNetworkName = (networkName: NetworkName): NetworkName | null => {
  if (networkName === NetworkName.MAINNET) return NetworkName.TESTNET
  if (networkName === NetworkName.TESTNET) return NetworkName.MAINNET

  return null
}

export const getNetworkNameFromSearchParams = (searchParams: SearchParamsLike): NetworkName | null => {
  return parseNetworkName(searchParams?.get('network') ?? undefined)
}

export const getHrefWithNetworkSearchParam = ({
  pathname,
  searchParams,
  networkName,
  hash,
}: {
  pathname: string
  searchParams?: SearchParamsWithToStringLike
  networkName: NetworkName
  hash?: string
}) => {
  const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? '')
  nextSearchParams.set('network', networkName)

  const queryString = nextSearchParams.toString()
  const hashSuffix = hash ? `#${hash}` : ''

  return queryString ? `${pathname}?${queryString}${hashSuffix}` : `${pathname}${hashSuffix}`
}

export const markNextNetworkSearchParamSyncAsManual = (networkName: NetworkName) => {
  pendingManualNetworkSearchParamSync = networkName
}

export const consumeManualNetworkSearchParamSync = (networkName: NetworkName) => {
  if (pendingManualNetworkSearchParamSync !== networkName) return false

  pendingManualNetworkSearchParamSync = null
  return true
}

export const resetManualNetworkSearchParamSync = () => {
  pendingManualNetworkSearchParamSync = null
}

export const getTransactionIdFromPathname = (pathname: string): TransactionId | null => {
  const transactionId = pathname.match(/\/transactions?\/([^/]+?)(?:\/)?$/)?.[1]
  const result = transactionIdSchema.safeParse(transactionId)

  return result.success ? result.data : null
}

export const getDashboardPathname = (pathname: string) => {
  const firstSegment = pathname.split('/')[1]

  if (firstSegment && i18nConfig.locales.includes(firstSegment as Locale)) {
    return `/${firstSegment}`
  }

  return '/'
}

export const getManualNetworkSwitchHref = ({
  pathname,
  searchParams,
  networkName,
  transactionExistsOnTargetNetwork,
}: {
  pathname: string
  searchParams?: SearchParamsReadable
  networkName: NetworkName
  transactionExistsOnTargetNetwork?: boolean
}) => {
  const transactionId = getTransactionIdFromPathname(pathname)

  if (transactionId) {
    if (transactionExistsOnTargetNetwork) {
      return getHrefWithNetworkSearchParam({ pathname, searchParams, networkName })
    }

    return getHrefWithNetworkSearchParam({
      pathname: getDashboardPathname(pathname),
      networkName,
    })
  }

  if (getNetworkNameFromSearchParams(searchParams)) {
    return getHrefWithNetworkSearchParam({ pathname, searchParams, networkName })
  }

  return null
}

/**
 * Parse and validate network name from search params.
 * Returns the validated network name or defaults to the appropriate network.
 *
 * @param searchParams - Promise of search params containing optional network field
 * @returns Promise of validated NetworkName
 */
export async function parseNetworkFromParams(
  searchParams: Promise<{ network?: string | NetworkName }>,
): Promise<NetworkName> {
  const { network } = await searchParams
  return resolveNetworkName(network)
}
