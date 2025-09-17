import { ThorClient } from '@vechain/sdk-network'
import { NETWORKS, type NetworkName } from '@/lib/constants/network'

const clientCache = new Map<NetworkName, ThorClient>()

export function getThorClient(networkName: NetworkName): ThorClient {
  const cachedClient = clientCache.get(networkName)

  if (cachedClient) {
    return cachedClient
  }

  const client = ThorClient.at(NETWORKS[networkName].url)
  clientCache.set(networkName, client)

  return client
}
