"use client"

import React, { useState } from "react"
import { useNetwork } from "@/hooks/network/useNetwork"
import { VALID_NETWORKS } from "@/constants/network/NetworkConst"
import { Box, Text } from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "../ui/NativeSelect"
import { LuGlobe } from "react-icons/lu"

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
    <Box width="120px">
      <NativeSelectRoot icon={<LuGlobe color="white" />} size="md">
        <NativeSelectField
          placeholder="--Please choose a network--"
          value={selectedNetwork?.url || ""}
          onChange={handleNetworkChange}
          bg="gray.500"
          border={"none"}
          color="white"
          fontWeight={"600"}
          _hover={{ bg: "gray.200" }}
          _focus={{ bg: "gray.200", outline: "none", boxShadow: "outline" }}>
          {VALID_NETWORKS.map(network => (
            <option key={network.url} value={network.url}>
              {network.name}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
      {error && (
        <Text color="red.500" mt="2" fontSize="sm">
          {error}
        </Text>
      )}
    </Box>
  )
}

export default NetworkSwitcher
