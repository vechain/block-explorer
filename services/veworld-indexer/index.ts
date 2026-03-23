import { VEWORLD_INDEXER_MAINNET_URL, VEWORLD_INDEXER_SOLO_URL, VEWORLD_INDEXER_TESTNET_URL } from '@/env.public'
import { apiClient } from '@/lib/api'
import { NetworkName } from '@/lib/constants/network'

export enum IndexerVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export const INDEXER_HEADERS = { 'X-Project-Id': 'block-explorer' }

export const indexerGet = <T>(args: Parameters<typeof apiClient.get<T>>[0]) =>
  apiClient.get<T>({
    ...args,
    headers: { ...INDEXER_HEADERS, ...args.headers },
  })

export const resolveUrl = (networkName: NetworkName, version: IndexerVersion = IndexerVersion.V1) => {
  if (version === IndexerVersion.V1 || version === IndexerVersion.V2) {
    if (networkName === NetworkName.SOLO) return `${VEWORLD_INDEXER_SOLO_URL}/api/${version}`
    if (networkName === NetworkName.TESTNET) return `${VEWORLD_INDEXER_TESTNET_URL}/api/${version}`
    return `${VEWORLD_INDEXER_MAINNET_URL}/api/${version}`
  }
  throw new Error(`Invalid indexer version: ${version}`)
}
