import { useState } from "react"
import { ThorClient } from "@vechain/sdk-network"

import { NETWORKS, NetworkName } from "@/constants/network"
import { ThorClientContext } from "./ThorClientContext"

const defaultNetwork = NETWORKS[NetworkName.MAINNET]
const defaultThorClient = ThorClient.at(defaultNetwork.url)

export const ThorClientProvider = ({ children }: React.PropsWithChildren) => {
  const [activeNetwork, setActiveNetwork] = useState(defaultNetwork)
  const [thorClient, setThorClient] = useState(defaultThorClient)

  async function switchNetwork(name: NetworkName) {
    const network = NETWORKS[name]
    if (!network) {
      throw new Error("Invalid network")
    }

    const client = ThorClient.at(network.url)
    const healthy = await client.nodes.isHealthy()
    if (!healthy) {
      throw new Error("Network is not healthy")
    }

    setThorClient(client)
    setActiveNetwork(network)
  }

  return (
    <ThorClientContext.Provider value={{ thorClient, activeNetwork, switchNetwork }}>{children}</ThorClientContext.Provider>
  )
}
