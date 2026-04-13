import z from 'zod'
import { DEFAULT_NETWORK, NetworkName } from '@/lib/constants/network'

const DEFAULT_NETWORK_NAME = DEFAULT_NETWORK.name
const networkNameSchema = z.enum([NetworkName.MAINNET, NetworkName.TESTNET, NetworkName.SOLO])

type SearchParamsLike = Pick<URLSearchParams, 'get'> | null | undefined

export const parseNetworkName = (network?: string | null): NetworkName | null => {
  const result = networkNameSchema.safeParse(network)
  return result.success ? result.data : null
}

export const resolveNetworkName = (network?: string | null): NetworkName => {
  return parseNetworkName(network) ?? DEFAULT_NETWORK_NAME
}

export const getNetworkNameFromSearchParams = (searchParams: SearchParamsLike): NetworkName | null => {
  return parseNetworkName(searchParams?.get('network') ?? undefined)
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
