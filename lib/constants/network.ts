import { MAINNET_URL, TESTNET_URL } from '@vechain/sdk-network'
import { DEV_MODE_DEFAULTS } from './dev-mode'

export type Network = {
  name: NetworkName
  url: string
  contracts: {
    X2EarnRewardsPool?: string
  }
}

export enum NetworkName {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  SOLO = 'solo',
}

const NETWORK_GENESIS_TIMESTAMPS: Record<NetworkName, number | null> = {
  [NetworkName.MAINNET]: 1530316800,
  [NetworkName.TESTNET]: 1530014400,
  [NetworkName.SOLO]: null,
}

export const getNetworkGenesisTimestamp = (networkName: NetworkName) => NETWORK_GENESIS_TIMESTAMPS[networkName]

const mainnet: Network = {
  name: NetworkName.MAINNET,
  url: MAINNET_URL,
  contracts: { X2EarnRewardsPool: '0x6Bee7DDab6c99d5B2Af0554EaEA484CE18F52631' },
}

const testnet: Network = {
  name: NetworkName.TESTNET,
  url: TESTNET_URL,
  contracts: { X2EarnRewardsPool: '0x5F8f86B8D0Fa93cdaE20936d150175dF0205fB38' },
}

const solo: Network = {
  name: NetworkName.SOLO,
  url: DEV_MODE_DEFAULTS.soloNodeUrl,
  contracts: {},
}

export const DEFAULT_NETWORK: Network = mainnet

export const NETWORKS: Record<NetworkName, Network> = {
  [NetworkName.MAINNET]: mainnet,
  [NetworkName.TESTNET]: testnet,
  [NetworkName.SOLO]: solo,
}
