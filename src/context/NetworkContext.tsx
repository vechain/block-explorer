import { createContext } from "react"
import { ThorClient } from "@vechain/sdk-network"
import { Network } from "@/constants/network/NetworkConst.ts"

export type NetworkContextType = {
  thorClient: ThorClient
  switchNetwork: (url: string) => Promise<void>
  selectedNetwork: Network
}

export const NetworkContext = createContext<NetworkContextType | undefined>(undefined)
