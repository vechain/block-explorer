import z from 'zod'
import { IS_SOLO } from '@/env.public'
import { NetworkName } from '@/lib/constants/network'
import { zodParse } from './zod'

const DEFAULT_NETWORK_NAME = IS_SOLO ? NetworkName.SOLO : NetworkName.MAINNET

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
  const networkName = network || DEFAULT_NETWORK_NAME

  return zodParse({
    data: networkName,
    schema: z.enum(Object.values(NetworkName) as [NetworkName, ...NetworkName[]]),
    errorMessage: 'Invalid network name',
    fallbackData: DEFAULT_NETWORK_NAME,
  })
}
