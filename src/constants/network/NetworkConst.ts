import { MAINNET_URL, TESTNET_URL } from "@vechain/sdk-network"

export type Network = {
  name: NETWORK
  url: string
}

export enum NETWORK {
  MAIN = "Mainnet",
  TEST = "Testnet",
  SOLO = "Solo",
}

export const VALID_NETWORKS: Network[] = [
  { name: NETWORK.MAIN, url: MAINNET_URL },
  { name: NETWORK.TEST, url: TESTNET_URL },
  { name: NETWORK.SOLO, url: "http://localhost:8669" },
]
