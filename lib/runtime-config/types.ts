import type { AddressString } from '@/lib/schemas'

export type RuntimeConfig = {
  appVersion: string
  allowDevMode: boolean
  bypassIndexerProxy: boolean
  soloContracts: {
    b3tr?: AddressString
    vot3?: AddressString
    stargateNft?: AddressString
    stargateDelegation?: AddressString
  }
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  appVersion: 'dev',
  allowDevMode: false,
  bypassIndexerProxy: false,
  soloContracts: {},
}

export const RUNTIME_CONFIG_WINDOW_KEY = '__BLOCK_EXPLORER_RUNTIME_CONFIG__'
