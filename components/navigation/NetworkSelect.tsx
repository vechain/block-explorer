import { Box, Flex } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { IS_SOLO } from '@/env.public'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
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

export const NetworkSelect = () => {
  if (IS_SOLO) {
    return <SoloNetworkLabel />
  }

  return <NetworkToggle />
}

const SoloNetworkLabel = () => {
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
      <Box py={{ base: 1, md: 2 }} px={{ base: 2, md: 4 }} position="relative">
        <MotionBox
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="accent-tertiary"
          color="text-alt-primary"
          rounded="full"
        />
        <MotionText
          as="span"
          position="relative"
          color="text-alt-primary"
          textTransform="capitalize"
          fontSize={{ base: 'body-s', md: 'body-m' }}
        >
          {NetworkName.SOLO}
        </MotionText>
      </Box>
    </Flex>
  )
}

const NetworkToggle = () => {
  const { activeNetwork, setActiveNetwork } = useSettingsStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleNetworkChange = async (newNetworkName: NetworkName) => {
    if (newNetworkName === activeNetwork.name) return

    const thorClient = getThorClient(newNetworkName)
    const healthy = await thorClient.nodes.isHealthy()
    if (!healthy) {
      console.error(`Network is not healthy: ${newNetworkName}`)
      return
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

    setActiveNetwork(NETWORKS[newNetworkName])

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
    <Box
      py={{ base: 1, md: 2 }}
      px={{ base: 2, md: 4 }}
      cursor="pointer"
      position="relative"
      onClick={() => {
        void onNetworkChange(networkName)
      }}
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
