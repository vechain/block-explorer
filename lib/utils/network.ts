import z from 'zod'
import { NetworkName } from '@/lib/constants/network'
import { zodParse } from './zod'

/**
 * Parse and validate network name from search params.
 * Returns the validated network name or defaults to MAINNET.
 *
 * @param searchParams - Promise of search params containing optional network field
 * @returns Promise of validated NetworkName
 */
export async function parseNetworkFromParams(
  searchParams: Promise<{ network?: string | NetworkName }>,
): Promise<NetworkName> {
  const { network } = await searchParams
  const networkName = network || NetworkName.MAINNET

  return zodParse({
    data: networkName,
    schema: z.enum(Object.values(NetworkName) as [NetworkName, ...NetworkName[]]),
    errorMessage: 'Invalid network name',
    fallbackData: NetworkName.MAINNET,
  })
}
