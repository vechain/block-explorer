// src/components/network/NetworkSwitcher.tsx
import React from "react"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { VALID_NETWORKS } from "@/constants/network/NetworkConst.ts"

const NetworkSwitcher: React.FC = () => {
  const { switchNetwork, selectedNetwork } = useNetwork()

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = event.target.value
    switchNetwork(newNetwork).catch(error => {
      // TODO: Display an error message to the user
      console.error(error)
    })
  }

  return (
    <div>
      <label htmlFor="network-select">Select Network:</label>
      <select id="network-select" value={selectedNetwork.url} onChange={handleNetworkChange}>
        <option value="">--Please choose a network--</option>
        {VALID_NETWORKS.map(network => (
          <option key={network.url} value={network.url}>
            {network.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default NetworkSwitcher
