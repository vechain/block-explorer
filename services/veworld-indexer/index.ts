import { ApiError, apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { getRuntimeIndexerBaseUrl } from '@/lib/utils/runtime-network'

export enum IndexerVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export const INDEXER_HEADERS = { 'X-Project-Id': 'block-explorer' }

export const resolveUrl = (networkName: NetworkName, version: IndexerVersion = IndexerVersion.V1) =>
  `${getRuntimeIndexerBaseUrl(networkName)}/api/${version}`

// The client joins baseUrl and endPoint bare, and not every caller leads with a slash.
const joinable = (endPoint: string) => (endPoint.startsWith('/') ? endPoint : `/${endPoint}`)

interface IndexerFetchArgs {
  networkName: NetworkName
  endPoint: string
  params?: Record<string, string | string[] | undefined>
  version?: IndexerVersion
}

export const indexerFetch = <T>({ networkName, endPoint, params, version = IndexerVersion.V1 }: IndexerFetchArgs) =>
  apiClient.get<T>({
    baseUrl: resolveUrl(networkName, version),
    endPoint: joinable(endPoint),
    params,
    headers: INDEXER_HEADERS,
  })

/** For a lookup whose 404 means the address simply has no such record. */
export const indexerFetchOrNull = async <T>(args: IndexerFetchArgs): Promise<T | null> => {
  try {
    const { data } = await indexerFetch<T>(args)
    return data ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
