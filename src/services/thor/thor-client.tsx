"use client"

import { createContext, useContext } from "react"
import { ThorClient } from "@vechain/sdk-network"

import { NETWORKS, Network, NetworkName } from "@/constants/network"
import { useState } from "react"

type ThorClientContextType = {
  thorClient: ThorClient
  activeNetwork: Network
  switchNetwork: (name: NetworkName) => Promise<void>
}

const defaultNetwork = NETWORKS[NetworkName.MAINNET]
const defaultThorClient = ThorClient.at(defaultNetwork.url)

const ThorClientContext = createContext<ThorClientContextType>({
  thorClient: ThorClient.at(defaultNetwork.url),
  activeNetwork: defaultNetwork,
  switchNetwork: async () => {
    throw new Error("switchNetwork not ready")
  },
})

export function useThorClient() {
  const context = useContext(ThorClientContext)
  if (!context) {
    throw new Error("useThorClient must be used within a ThorClientProvider")
  }
  return context
}

export const ThorClientProvider = ({ children }: React.PropsWithChildren) => {
  const [activeNetwork, setActiveNetwork] = useState(defaultNetwork)
  const [thorClient, setThorClient] = useState(defaultThorClient)

  async function switchNetwork(name: NetworkName) {
    const network = NETWORKS[name]
    if (!network) {
      throw new Error("Invalid network")
    }

    thorClient.destroy()
    const client = ThorClient.at(network.url)

    const healthy = await client.nodes.isHealthy()
    if (!healthy) {
      throw new Error("Network is not healthy")
    }

    setThorClient(client)
    setActiveNetwork(network)
  }

  return (
    <ThorClientContext.Provider value={{ thorClient, activeNetwork, switchNetwork }}>
      {children}
    </ThorClientContext.Provider>
  )
}
