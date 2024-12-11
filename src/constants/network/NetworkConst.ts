import { MAINNET_URL, TESTNET_URL } from "@vechain/sdk-network"

export type Network = {
  name: NETWORK
  url: string
  contracts: {
    X2EarnRewardsPool?: string
  }
}

export enum NETWORK {
  MAIN = "Mainnet",
  TEST = "Testnet",
  SOLO = "Solo",
}

export const VALID_NETWORKS: Network[] = [
  {
    name: NETWORK.MAIN,
    url: MAINNET_URL,
    contracts: { X2EarnRewardsPool: "0x6Bee7DDab6c99d5B2Af0554EaEA484CE18F52631" },
  },
  {
    name: NETWORK.TEST,
    url: TESTNET_URL,
    contracts: { X2EarnRewardsPool: "0x5F8f86B8D0Fa93cdaE20936d150175dF0205fB38" },
  },
  { name: NETWORK.SOLO, url: "http://localhost:8669", contracts: {} },
]
