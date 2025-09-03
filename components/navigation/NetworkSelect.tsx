'use client'

import { createListCollection, Field, Portal, Select } from '@chakra-ui/react'
import { useState } from 'react'
import { LuGlobe } from 'react-icons/lu'
import { NETWORKS, type NetworkName } from '@/lib/constants/network'
import { useThorClient } from '@/services/thor/thor-client'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

type NetworkItem = { label: string; value: NetworkName }

const networks = createListCollection<NetworkItem>({
  items: Object.values(NETWORKS).map(network => ({
    label: capitalize(network.name),
    value: network.name,
  })),
})

export const NetworkSelect = () => {
  const { switchNetwork, activeNetwork } = useThorClient()
  const [error, setError] = useState('')

  const handleNetworkChange = (details: Select.ValueChangeDetails<NetworkItem>) => {
    const [newNetwork] = details.value as NetworkName[]
    setError('')
    switchNetwork(newNetwork).catch(err => {
      console.error(`Failed to switch to ${newNetwork} network`, '\n', err)
      setError(`Failed to switch to ${newNetwork} network`)
    })
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
