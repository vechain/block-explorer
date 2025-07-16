"use client"

import { NetworkName, NETWORKS } from "@/constants/network"
import { useSwitchNetwork } from "@/hooks/thor/useSwitchNetwork"
import { Field, Portal, Select, createListCollection } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { LuGlobe } from "react-icons/lu"

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

type NetworkItem = { label: string; value: NetworkName }

const networks = createListCollection<NetworkItem>({
  items: Object.values(NETWORKS).map(network => ({
    label: capitalize(network.name),
    value: network.name,
  })),
})

export const NetworkSelect = () => {
  const queryClient = useQueryClient()
  const { switchNetwork, activeNetwork } = useSwitchNetwork()
  const [error, setError] = useState("")

  const handleNetworkChange = (details: Select.ValueChangeDetails<NetworkItem>) => {
    const [newNetwork] = details.value as NetworkItem["value"][]
    setError("")
    switchNetwork(newNetwork).catch(err => {
      console.error("Failed to switch network:", err)
      setError("Failed to switch network")
    })
    queryClient.resetQueries()
  }

  return (
    <Field.Root invalid={!!error}>
      <Select.Root collection={networks} width="120px" value={[activeNetwork.name]} onValueChange={handleNetworkChange}>
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select network" />
            <LuGlobe color="fg" />
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {networks.items.map(network => (
                <Select.Item item={network} key={network.value}>
                  {network.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  )
}
