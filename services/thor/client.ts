import { ThorClient } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import { getRuntimeNetwork } from '@/lib/utils/runtime-network'

const clientCache = new Map<string, ThorClient>()

export function getThorClient(networkName: NetworkName): ThorClient {
  const network = getRuntimeNetwork(networkName)
  const cacheKey = `${network.name}:${network.url}`
  const cachedClient = clientCache.get(cacheKey)

  if (cachedClient) {
    return cachedClient
  }

  const client = ThorClient.at(network.url)
  clientCache.set(cacheKey, client)

  return client
}
