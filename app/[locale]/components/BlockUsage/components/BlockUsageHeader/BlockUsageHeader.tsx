'use client'

import { Flex, Heading, HStack, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { TimeRangeKey } from '../../constants'
import { NavigationControls } from './components/NavigationControls'
import { NowButton } from './components/NowButton'
import { TimeRangeSelect } from './components/TimeRangeSelect'

interface BlockUsageHeaderProps {
  selectedRange: TimeRangeKey
  selectedDate: Date | null
  canGoBack: boolean
  canGoForward: boolean
  onRangeChange: (newRange: TimeRangeKey) => void
  onNavigateBack: () => void
  onNavigateForward: () => void
  onResetToNow: () => void
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onHourChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const BlockUsageHeader = ({
  selectedRange,
  selectedDate,
  canGoBack,
  canGoForward,
  onRangeChange,
  onNavigateBack,
  onNavigateForward,
  onResetToNow,
  onDateChange,
  onHourChange,
}: BlockUsageHeaderProps) => {
  const { t } = useTranslation()

  return (
    <Stack
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      gap={4}
    >
      <HStack justify="space-between" align="center" w={{ base: '100%', md: 'auto' }}>
        <Heading as="h2" textStyle="displayXs">
          {t('Block Usage')}
        </Heading>
        <Flex gap={2} hideFrom="md">
          <TimeRangeSelect selectedRange={selectedRange} onRangeChange={onRangeChange} />
          <NowButton onClick={onResetToNow} />
        </Flex>
      </HStack>
      <HStack align="center" gap={2} flexShrink={0} flex={{ base: '1', md: '0' }}>
        {selectedRange !== 'all' && (
          <NavigationControls
            selectedRange={selectedRange}
            selectedDate={selectedDate}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onNavigateBack={onNavigateBack}
            onNavigateForward={onNavigateForward}
            onDateChange={onDateChange}
            onHourChange={onHourChange}
          />
        )}
        <Flex gap={2} hideBelow="md">
          <TimeRangeSelect selectedRange={selectedRange} onRangeChange={onRangeChange} />
          <NowButton onClick={onResetToNow} />
        </Flex>
      </HStack>
    </Stack>
  )
}
