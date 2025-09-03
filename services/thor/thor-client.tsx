'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ThorClient } from '@vechain/sdk-network'
import { createContext, useContext, useState } from 'react'
import { NETWORKS, type Network, NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'

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
    throw new Error('switchNetwork not ready')
  },
})

export const useThorClient = () => {
  const context = useContext(ThorClientContext)
  if (!context) {
    throw new Error('useThorClient must be used within a ThorClientProvider')
  }
  return context
}

export const ThorClientProvider = ({ children }: React.PropsWithChildren) => {
  const { activeNetwork, setActiveNetwork } = useSettingsStore()
  const [thorClient, setThorClient] = useState(defaultThorClient)
  const queryClient = useQueryClient()

  const switchNetwork = async (name: NetworkName) => {
    const selectedNetwork = NETWORKS[name]
    if (!selectedNetwork) {
      throw new Error('Invalid network')
    }

    thorClient.destroy()
    const client = ThorClient.at(selectedNetwork.url)

    const healthy = await client.nodes.isHealthy()

    if (!healthy) {
      throw new Error('Network is not healthy')
    }

    setThorClient(client)
    setActiveNetwork(selectedNetwork)

    queryClient.invalidateQueries()
  }

  return (
    <ThorClientContext.Provider value={{ thorClient, activeNetwork, switchNetwork }}>
      {children}
    </ThorClientContext.Provider>
  )
}
