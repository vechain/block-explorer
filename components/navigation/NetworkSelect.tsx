import { Box, Flex } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'
import { MotionBox } from '../ui/MotionBox'
import { MotionText } from '../ui/MotionText'

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

  const handleNetworkToggle = () => {
    const newNetworkName = activeNetwork.name === NetworkName.MAINNET ? NetworkName.TESTNET : NetworkName.MAINNET
    handleNetworkChange(newNetworkName)
  }

  return (
    <Flex
      gap={1}
      alignItems="center"
      border="1px solid"
      borderColor="bg-card-surface-2"
      bg="bg-card-surface-2"
      p={1.5}
      rounded="full"
      textStyle="bodyMSemibold"
      onClick={handleNetworkToggle}
      cursor="pointer">
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
}: {
  networkName: NetworkName
  isActive: boolean
  onNetworkChange: (network: NetworkName) => void
}) => {
  return (
    <Box py={{ base: 1, md: 2 }} px={{ base: 2, md: 4 }} cursor="pointer" position="relative">
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
      <MotionText
        as="span"
        position="relative"
        animate={{ color: isActive ? 'var(--chakra-colors-bg-primary)' : 'var(--chakra-colors-text-primary)' }}
        textTransform="capitalize"
        fontSize={{ base: 'body-s', md: 'body-m' }}>
        {networkName}
      </MotionText>
    </Box>
  )
}
