import { MAINNET_URL, TESTNET_URL } from "@vechain/sdk-network"

export type Network = {
  name: NetworkName
  url: string
  contracts: {
    X2EarnRewardsPool?: string
  }
}

export enum NetworkName {
  MAINNET = "mainnet",
  TESTNET = "testnet",
  SOLO = "solo",
}

const mainnet: Network = {
  name: NetworkName.MAINNET,
  url: MAINNET_URL,
  contracts: { X2EarnRewardsPool: "0x6Bee7DDab6c99d5B2Af0554EaEA484CE18F52631" },
}

const testnet: Network = {
  name: NetworkName.TESTNET,
  url: TESTNET_URL,
  contracts: { X2EarnRewardsPool: "0x5F8f86B8D0Fa93cdaE20936d150175dF0205fB38" },
}

const solo: Network = {
  name: NetworkName.SOLO,
  url: "http://localhost:8669",
  contracts: {},
}

export const NETWORKS: Record<NetworkName, Network> = {
  [NetworkName.MAINNET]: mainnet,
  [NetworkName.TESTNET]: testnet,
  [NetworkName.SOLO]: solo,
}
