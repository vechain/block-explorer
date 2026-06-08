'use client'

import { Box, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

/**
 * Small pulsing "Live" indicator used next to section headings whose
 * underlying data streams via React Query refetch intervals.
 */
export const LiveBadge = () => {
  const { t } = useTranslation()
  return (
    <Flex alignItems="center" gap="1.5">
      <Box
        position="relative"
        width="8px"
        height="8px"
        rounded="full"
        bg="success-text"
        boxShadow="0 0 0 0 rgba(16,255,161,0.55)"
        animation="liveBadgePulse 1.8s infinite"
        css={{
          '@keyframes liveBadgePulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(16,255,161,0.55)' },
            '70%': { boxShadow: '0 0 0 7px rgba(16,255,161,0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(16,255,161,0)' },
          },
        }}
      />
      <Text textStyle="bodyS" color="success-text" fontWeight="medium">
        {t('Live')}
      </Text>
    </Flex>
  )
}
