import { apiClient } from '@/lib/api'
import { NetworkName } from '@/lib/constants/network'
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
