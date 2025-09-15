'use client'

import { createListCollection, Field, Portal, Select } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { ThorClient } from '@vechain/sdk-network'
import { useState } from 'react'
import { LuGlobe } from 'react-icons/lu'
import { NETWORKS, type NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

type NetworkItem = { label: string; value: NetworkName }

const networks = createListCollection<NetworkItem>({
  items: Object.values(NETWORKS).map(network => ({
    label: capitalize(network.name),
    value: network.name,
  })),
})

export const NetworkSelect = () => {
  const { setActiveNetwork, activeNetwork } = useSettingsStore()
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const handleNetworkChange = async (details: Select.ValueChangeDetails<NetworkItem>) => {
    setError('')

    const [newNetworkName] = details.value as NetworkName[]
    const selectedNetwork = NETWORKS[newNetworkName]
    if (!selectedNetwork) {
      setError(`Invalid network: ${newNetworkName}`)
      return
    }

    const thorClient = ThorClient.at(selectedNetwork.url)
    const healthy = await thorClient.nodes.isHealthy()
    if (!healthy) {
      setError(`Network is not healthy: ${newNetworkName}`)
      return
    }

    setActiveNetwork(selectedNetwork)

    queryClient.invalidateQueries()
  }

  return (
    <Field.Root invalid={!!error} width="120px">
      <Select.Root collection={networks} value={[activeNetwork.name]} onValueChange={handleNetworkChange}>
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
