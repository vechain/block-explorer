'use client'

import { Box, HStack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { getNetworkLabel } from '@/lib/utils/network-label'

/** Shown only off mainnet, so the page never looks like production data when it isn't. */
export const NetworkBadge = () => {
  const { t } = useTranslation()
  const { activeNetwork } = useSettingsStore()

  if (activeNetwork.name === NetworkName.MAINNET) return null

  return (
    <HStack
      role="status"
      gap={1.5}
      px={2}
      py={0.5}
      border="1px solid"
      borderColor="accent-warm"
      color="accent-warm"
      rounded="full"
      userSelect="none"
      whiteSpace="nowrap"
    >
      <Box w="6px" h="6px" bg="accent-warm" rounded="full" aria-hidden="true" />
      <Text fontSize="body-s" fontWeight="600" textTransform="uppercase" letterSpacing="0.04em">
        {getNetworkLabel(t, activeNetwork.name)}
      </Text>
    </HStack>
  )
}
