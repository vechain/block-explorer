import React, { useState } from "react"
import { useNetwork } from "@/hooks/network/useNetwork"
import { VALID_NETWORKS } from "@/constants/network/NetworkConst"

const NetworkSwitcher: React.FC = () => {
  const { switchNetwork, selectedNetwork } = useNetwork()
  const [error, setError] = useState<string | null>(null)

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = event.target.value
    setError(null) // Clear any previous error
    switchNetwork(newNetwork).catch(err => {
      console.error("Failed to switch network:", err)
      setError("Failed to switch network. Please try again.")
    })
  }

  return (
    <div>
      <select id="network-select" value={selectedNetwork?.url || ""} onChange={handleNetworkChange}>
        <option value="" disabled>
          --Please choose a network--
        </option>
        {VALID_NETWORKS.map(network => (
          <option key={network.url} value={network.url}>
            {network.name}
          </option>
        ))}
      </select>
      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
    </div>
  )
}

export default NetworkSwitcher
