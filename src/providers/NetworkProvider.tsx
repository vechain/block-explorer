import { ReactNode, useState } from "react"
import { ThorClient } from "@vechain/sdk-network"
import { getNetworkByUrl } from "@/utils/network/NetworkUtils.ts"
import { NetworkContext } from "@/providers/NetworkContext.tsx"
import { VALID_NETWORKS } from "@/constants/network/NetworkConst.ts"

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [selectedNetwork, setSelectedNetwork] = useState(VALID_NETWORKS[0])
  const [thorClient, setThorClient] = useState(ThorClient.at(VALID_NETWORKS[0].url))

  const switchNetwork = async (url: string) => {
    const network = getNetworkByUrl(url)
    if (!network) {
      throw new Error("Invalid network")
    }

    const client = ThorClient.at(url)
    const healthy = await client.nodes.isHealthy()

    if (!healthy) {
      throw new Error("Network is not healthy")
    }

    setThorClient(client)
    setSelectedNetwork(network)
  }

  return (
    <NetworkContext.Provider value={{ thorClient, switchNetwork, selectedNetwork }}>{children}</NetworkContext.Provider>
  )
}
