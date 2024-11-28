import { MAINNET_URL, TESTNET_URL } from "@vechain/sdk-network"

export type Network = {
  name: string
  url: string
}

export const VALID_NETWORKS: Network[] = [
  { name: "Mainnet", url: MAINNET_URL },
  { name: "Testnet", url: TESTNET_URL },
  { name: "Solo", url: "http://localhost:8669" },
]
