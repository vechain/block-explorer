import { Box, Flex } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'
import { MotionBox } from '../ui/MotionBox'
import { MotionText } from '../ui/MotionText'

const DEFAULT_NETWORKS: NetworkName[] = [NetworkName.MAINNET, NetworkName.TESTNET]
const DEV_NETWORKS: NetworkName[] = [NetworkName.MAINNET, NetworkName.TESTNET, NetworkName.SOLO]

export const NetworkSelect = () => {
  const { setActiveNetwork, activeNetwork, isDevMode } = useSettingsStore()
  const queryClient = useQueryClient()
  const availableNetworks = isDevMode ? DEV_NETWORKS : DEFAULT_NETWORKS

  const handleNetworkChange = async (newNetworkName: NetworkName) => {
    if (newNetworkName === activeNetwork.name) return

    if (newNetworkName !== NetworkName.SOLO) {
      const reachable = await isNetworkReachable(newNetworkName)
      if (!reachable) {
        console.error(`Network is not reachable: ${newNetworkName}`)
        return
      }
    }

    setActiveNetwork(newNetworkName)

    queryClient.invalidateQueries()
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
    >
      {availableNetworks.map(networkName => (
        <NetworkItem
          key={networkName}
          networkName={networkName}
          isActive={activeNetwork.name === networkName}
          onNetworkChange={handleNetworkChange}
        />
      ))}
    </Flex>
  )
}

const isNetworkReachable = async (networkName: NetworkName) => {
  try {
    const thorClient = getThorClient(networkName)
    await thorClient.blocks.getBestBlockCompressed()
    return true
  } catch (error) {
    console.error(`Failed to reach network: ${networkName}`, error)
    return false
  }
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
    <Box
      as="button"
      py={{ base: 1, md: 2 }}
      px={{ base: 2, md: 4 }}
      cursor="pointer"
      position="relative"
      onClick={() => onNetworkChange(networkName)}
      aria-pressed={isActive}
    >
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
