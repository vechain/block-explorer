import React, { useState } from "react"
import { useThorClient } from "@/hooks/thor/useThorClient"
import { Box, Text } from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "../ui/NativeSelect"
import { LuGlobe } from "react-icons/lu"
import { NetworkName, NETWORKS } from "@/constants/network"
import { useQueryClient } from "@tanstack/react-query"

export const NetworkSwitcher = () => {
  const { switchNetwork, activeNetwork } = useThorClient()
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = event.target.value as NetworkName
    setError(null) // Clear any previous error
    switchNetwork(newNetwork).catch(err => {
      console.error("Failed to switch network:", err)
      setError("Failed to switch network. Please try again.")
    })
    queryClient.resetQueries()
  }

  return (
    <Box width="120px">
      <NativeSelectRoot icon={<LuGlobe color="white" />} size="md">
        <NativeSelectField
          placeholder="--Please choose a network--"
          value={activeNetwork.name}
          onChange={handleNetworkChange}
          bg="gray.500"
          border={"none"}
          color="white"
          fontWeight={"600"}
          _hover={{ bg: "gray.200" }}
          _focus={{ bg: "gray.200", outline: "none", boxShadow: "outline" }}>
          {Object.values(NETWORKS).map(network => (
            <option key={network.url} value={network.name}>
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
