import { ReactNode, useState } from "react"
import { ThorClient } from "@vechain/sdk-network"
import { getNetworkByUrl } from "@/utils/network/NetworkUtils.ts"
import { NetworkContext } from "@/context/NetworkContext.tsx"
import { VALID_NETWORKS } from "@/constants/network/NetworkConst.ts"

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [selectedNetwork, setSelectedNetwork] = useState(VALID_NETWORKS[0])
  const [thorClient, setThorClient] = useState(ThorClient.at(VALID_NETWORKS[0].url))

  const switchNetwork = (url: string) => {
    const network = getNetworkByUrl(url)
    if (!network) {
      throw new Error("Invalid network")
    }
    setThorClient(ThorClient.at(url))
    setSelectedNetwork(network)
  }

  return (
    <NetworkContext.Provider value={{ thorClient, switchNetwork, selectedNetwork }}>{children}</NetworkContext.Provider>
  )
}
