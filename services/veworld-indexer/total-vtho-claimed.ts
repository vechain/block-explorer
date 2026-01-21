import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { resolveUrl } from '.'

const TOTAL_VTHO_CLAIMED_QUERY_KEY = 'getTotalVthoClaimed'

export const totalVthoClaimedQueryOptions = (networkName: NetworkName, address: AddressString | undefined) => ({
  queryKey: [TOTAL_VTHO_CLAIMED_QUERY_KEY, networkName, address],
  queryFn: () => getTotalVthoClaimed({ networkName, address: address! }),
  enabled: !!address,
  refetchInterval: 60 * 1000,
})

const getTotalVthoClaimed = async ({
  networkName,
  address,
}: {
  networkName: NetworkName
  address: AddressString
}): Promise<bigint> => {
  const baseUrl = resolveUrl(networkName)
  const url = `${baseUrl}/stargate/total-vtho-claimed/${address}?rewardsType=DELEGATION`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: '*/*',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch total VTHO claimed data')
  }

  const raw = await response.text()

  // Handle accidental double-serialization from backend (i.e. string containing a quoted string)
  let cleaned = raw.trim()
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }

  if (!/^\d+$/.test(cleaned)) {
    throw new Error(`Invalid VTHO value received: ${cleaned}`)
  }

  return BigInt(cleaned)
}
