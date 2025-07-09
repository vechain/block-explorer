import { createContext } from "react"
import { ThorClient } from "@vechain/sdk-network"
import { Network, NetworkName } from "@/constants/network"

type ThorClientContextType = {
  thorClient: ThorClient
  activeNetwork: Network
  switchNetwork: (name: NetworkName) => Promise<void>
}

export const ThorClientContext = createContext<ThorClientContextType | undefined>(undefined)
