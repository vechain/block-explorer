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

    const oldNetworkName = activeNetwork.name
    setActiveNetwork(NETWORKS[newNetworkName])

    // Cancel ongoing queries and remove cached data for the old network
    // This prevents unnecessary refetches when switching networks
    queryClient.cancelQueries({
      predicate: query => {
        const queryKey = query.queryKey
        // Check if the query key contains the old network name (typically at index 1)
        return Array.isArray(queryKey) && queryKey[1] === oldNetworkName
      },
    })
    queryClient.removeQueries({
      predicate: query => {
        const queryKey = query.queryKey
        return Array.isArray(queryKey) && queryKey[1] === oldNetworkName
      },
    })
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
      borderColor="border-primary"
      bg="bg-primary"
      p={1.5}
      rounded="full"
      textStyle="bodyMSemibold"
      onClick={handleNetworkToggle}
      cursor="pointer"
    >
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
          bg="accent-tertiary"
          color="text-alt-primary"
          rounded="full"
        />
      )}
      <MotionText
        as="span"
        position="relative"
        color={isActive ? 'text-alt-primary' : 'text-primary'}
        animate={{ color: isActive ? 'text-alt-primary' : 'text-primary' }}
        textTransform="capitalize"
        fontSize={{ base: 'body-s', md: 'body-m' }}
      >
        {networkName}
      </MotionText>
    </Box>
  )
}
