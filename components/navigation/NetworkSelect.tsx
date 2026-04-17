import { Box, Flex } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { NetworkName } from '@/lib/constants/network'
import { getRuntimeConfig } from '@/lib/runtime-config/get'
import { useSettingsStore } from '@/lib/stores/settings'
import {
  getManualNetworkSwitchHref,
  getTransactionIdFromPathname,
  markNextNetworkSearchParamSyncAsManual,
} from '@/lib/utils/network'
import { getThorClient } from '@/services/thor/client'
import { getTransaction } from '@/services/thor/transaction'
import { MotionBox } from '../ui/MotionBox'
import { MotionText } from '../ui/MotionText'

const DEFAULT_NETWORKS: NetworkName[] = [NetworkName.MAINNET, NetworkName.TESTNET]
const DEV_NETWORKS: NetworkName[] = [NetworkName.MAINNET, NetworkName.TESTNET, NetworkName.SOLO]

export const NetworkSelect = () => {
  const { activeNetwork, isDevMode, setActiveNetwork } = useSettingsStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { allowDevMode } = getRuntimeConfig()
  const availableNetworks = allowDevMode && isDevMode ? DEV_NETWORKS : DEFAULT_NETWORKS

  const handleNetworkChange = async (newNetworkName: NetworkName) => {
    if (newNetworkName === activeNetwork.name) return

    if (newNetworkName !== NetworkName.SOLO) {
      const reachable = await isNetworkReachable(newNetworkName)
      if (!reachable) {
        console.error(`Network is not reachable: ${newNetworkName}`)
        return
      }
    }

    const transactionId = getTransactionIdFromPathname(pathname)

    if (transactionId) {
      try {
        const transaction = await getTransaction({
          networkName: newNetworkName,
          transactionId,
        })
        const nextHref = getManualNetworkSwitchHref({
          pathname,
          searchParams,
          networkName: newNetworkName,
          transactionExistsOnTargetNetwork: Boolean(transaction),
        })

        if (nextHref) {
          markNextNetworkSearchParamSyncAsManual(newNetworkName)
          router.push(nextHref)
          return
        }
      } catch (error) {
        console.error('Failed to resolve transaction on the selected network', error)
        return
      }
    }

    const nextHref = getManualNetworkSwitchHref({
      pathname,
      searchParams,
      networkName: newNetworkName,
    })

    if (nextHref) {
      markNextNetworkSearchParamSyncAsManual(newNetworkName)
      router.push(nextHref)
      return
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
  onNetworkChange: (network: NetworkName) => Promise<void>
}) => {
  return (
    <Box
      as="button"
      py={{ base: 1, md: 2 }}
      px={{ base: 2, md: 4 }}
      cursor="pointer"
      position="relative"
      onClick={() => {
        void onNetworkChange(networkName)
      }}
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
