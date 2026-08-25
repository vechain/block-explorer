import { apiClient } from '@/lib/api'
import { NetworkName } from '@/lib/constants/network'
import { INDEXER_PROXY_BASE, isCachedIndexerEndpoint, isProxiedNetwork } from '@/lib/indexer-proxy'
import { getRuntimeIndexerBaseUrl } from '@/lib/utils/runtime-network'

export enum IndexerVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export const INDEXER_HEADERS = { 'X-Project-Id': 'block-explorer' }

export const indexerGet = <T>(args: Parameters<typeof apiClient.get>[0]) =>
  apiClient.get<T>({
    ...args,
    headers: { ...INDEXER_HEADERS, ...args.headers },
  })

export const resolveUrl = (networkName: NetworkName, version: IndexerVersion = IndexerVersion.V1) => {
  if (version === IndexerVersion.V1 || version === IndexerVersion.V2) {
    return `${getRuntimeIndexerBaseUrl(networkName)}/api/${version}`
  }
  throw new Error(`Invalid indexer version: ${version}`)
}

// Proxied endpoints are cached server-side; anything else (and always solo, whose
// indexer URL is browser-local) goes direct. `network` is appended last so a caller
// cannot shadow it.
export const indexerCachedGet = <T>({
  networkName,
  endPoint,
  params,
}: {
  networkName: NetworkName
  endPoint: string
  params?: Record<string, string | string[] | undefined>
}) => {
  if (isProxiedNetwork(networkName) && isCachedIndexerEndpoint(endPoint)) {
    return apiClient.get<T>({
      baseUrl: INDEXER_PROXY_BASE,
      endPoint,
      params: { ...params, network: networkName },
    })
  }

  return indexerGet<T>({ baseUrl: resolveUrl(networkName), endPoint, params })
}
