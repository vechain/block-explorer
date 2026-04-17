import { MAINNET_URL, TESTNET_URL } from '@vechain/sdk-network'
import type { AddressString } from '@/lib/schemas'
import { DEV_MODE_DEFAULTS } from './dev-mode'

export type NetworkContracts = {
  b3tr?: AddressString
  vot3?: AddressString
  stargateNft?: AddressString
  stargateDelegation?: AddressString
}

export type Network = {
  name: NetworkName
  url: string
  contracts: NetworkContracts
}

export enum NetworkName {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  SOLO = 'solo',
}

const NETWORK_GENESIS_TIMESTAMPS: Record<NetworkName, number | null> = {
  [NetworkName.MAINNET]: 1530316800,
  [NetworkName.TESTNET]: 1530014400,
  [NetworkName.SOLO]: 1526400000,
}

export const getNetworkGenesisTimestamp = (networkName: NetworkName) => NETWORK_GENESIS_TIMESTAMPS[networkName]

const mainnet: Network = {
  name: NetworkName.MAINNET,
  url: MAINNET_URL,
  contracts: {
    b3tr: '0x5ef79995FE8a89e0812330E4378eB2660ceDe699',
    vot3: '0x76Ca782B59C74d088C7D2Cce2f211BC00836c602',
    stargateNft: '0x1856c533ac2d94340aaa8544d35a5c1d4a21dee7',
    stargateDelegation: '0x03C557bE98123fdb6faD325328AC6eB77de7248C',
  },
}

const testnet: Network = {
  name: NetworkName.TESTNET,
  url: TESTNET_URL,
  contracts: {
    b3tr: '0x95761346d18244bb91664181bf91193376197088',
    vot3: '0x6e8b4a88d37897fc11f6ba12c805695f1c41f40e',
    stargateNft: '0x887d9102f0003f1724d8fd5d4fe95a11572fcd77',
    stargateDelegation: '0x1e02b2953adefec225cf0ec49805b1146a4429c1',
  },
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
