'use client'

import { Box, Flex, Text } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

export const NetworkSelect = () => {
  const { setActiveNetwork, activeNetwork } = useSettingsStore()
  const queryClient = useQueryClient()

  const handleNetworkChange = async (newNetworkName: NetworkName) => {
    const thorClient = getThorClient(newNetworkName)
    const healthy = await thorClient.nodes.isHealthy()
    if (!healthy) {
      console.error(`Network is not healthy: ${newNetworkName}`)
      return
    }

    setActiveNetwork(NETWORKS[newNetworkName])

    queryClient.invalidateQueries()
  }

  return (
    <Flex
      gap={1}
      alignItems="center"
      bg="bg-card-surface-3"
      p={2}
      rounded="full"
      textStyle="bodyMSemibold"
      border="0.5px solid var(--chakra-colors-border-surface-2)">
      <NetworkItem
        networkName={NetworkName.MAINNET}
        isActive={activeNetwork.name === NetworkName.MAINNET}
        onNetworkChange={handleNetworkChange}
      />
      <NetworkItem
        networkName={NetworkName.TESTNET}
        isActive={activeNetwork.name === NetworkName.TESTNET}
        onNetworkChange={handleNetworkChange}
      />
    </Flex>
  )
}

const NetworkItem = ({
  networkName,
  isActive,
  onNetworkChange,
}: {
  networkName: NetworkName
  isActive: boolean
  onNetworkChange: (network: NetworkName) => void
}) => {
  return (
    <Box py={2} px={3} cursor="pointer" position="relative" onClick={() => onNetworkChange(networkName)}>
      {isActive && (
        <MotionBox
          position="absolute"
          layoutId="network"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="white"
          color="bg-primary"
          rounded="full"
        />
      )}
      <Text as="span" position="relative" color={isActive ? 'bg-primary' : 'text-primary'} textTransform="capitalize">
        {networkName}
      </Text>
    </Box>
  )
}

const MotionBox = motion.create(Box)
