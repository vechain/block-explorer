import { VEWORLD_INDEXER_MAINNET_URL, VEWORLD_INDEXER_SOLO_URL, VEWORLD_INDEXER_TESTNET_URL } from '@/env.public'
import { NetworkName } from '@/lib/constants/network'

export const resolveUrl = (networkName: NetworkName) => {
  if (networkName === NetworkName.TESTNET) return VEWORLD_INDEXER_TESTNET_URL
  if (networkName === NetworkName.SOLO) {
    if (!VEWORLD_INDEXER_SOLO_URL) {
      throw new Error('VEWORLD_INDEXER_SOLO_URL is not set')
    }
    return VEWORLD_INDEXER_SOLO_URL
  }

  return VEWORLD_INDEXER_MAINNET_URL
}
