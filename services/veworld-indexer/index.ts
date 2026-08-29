import { ApiError, apiClient } from '@/lib/api'
import { NetworkName } from '@/lib/constants/network'
import { INDEXER_PROXY_BASE, isCachedIndexerEndpoint } from '@/lib/indexer-proxy'
import { isProxiedNetwork } from '@/lib/proxied-network'
import { proxyBaseUrl } from '@/lib/proxy-base-url'
import { getRuntimeConfig } from '@/lib/runtime-config/get'
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

type IndexerParams = Record<string, string | string[] | undefined>

// Registry keys are slashless, and the client joins baseUrl and endPoint bare.
const joinable = (endPoint: string) => (endPoint.startsWith('/') ? endPoint : `/${endPoint}`)

// Proxied endpoints are cached server-side; anything else (and always solo, whose
// indexer URL is browser-local) goes direct. `network` is appended last so a caller
// cannot shadow it.
interface IndexerCachedGetArgs {
  networkName: NetworkName
  /** The proxy's registry key, which is not always the upstream path. */
  endPoint: string
  params?: IndexerParams
  /** The upstream call for when the proxy is not used, where it differs from the proxy's. */
  direct?: { endPoint?: string; params?: IndexerParams; version?: IndexerVersion }
}

export const indexerCachedGet = <T>({ networkName, endPoint, params, direct }: IndexerCachedGetArgs) => {
  // Bypassing puts each call back on the viewer's own IP, which the indexer's WAF limits.
  if (!getRuntimeConfig().bypassIndexerProxy && isProxiedNetwork(networkName) && isCachedIndexerEndpoint(endPoint)) {
    return apiClient.get<T>({
      baseUrl: proxyBaseUrl(INDEXER_PROXY_BASE),
      endPoint: joinable(endPoint),
      params: { ...params, network: networkName },
    })
  }

  return indexerGet<T>({
    baseUrl: resolveUrl(networkName, direct?.version),
    endPoint: joinable(direct?.endPoint ?? endPoint),
    params: direct?.params ?? params,
  })
}

// For a lookup whose 404 means the address has no such record. Catching it here covers the
// direct path too, where the indexer's own 404 arrives instead of the proxy's.
export const indexerCachedGetOrNull = async <T>(args: IndexerCachedGetArgs): Promise<T | null> => {
  try {
    const { data } = await indexerCachedGet<T>(args)
    return data ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
