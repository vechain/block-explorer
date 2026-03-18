'use client'

import { Flex, HStack, Progress, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'

import { AddressString } from '@/lib/schemas/common'
import { VTHOBalance } from './Balance'
import { CopyableAddressLink } from './Links'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { TxGasFeesResult } from '@/hooks/useTransactionGasInsights'

export const TxFeePaid = ({ gasFees, gasPayer }: { gasFees: TxGasFeesResult; gasPayer: AddressString | null }) => {
  const { t } = useTranslation()

  if (gasFees.type === 'loading') return <Skeleton h="20px" w="80px" />

  if (gasPayer) {
    return (
      <Flex alignItems="center" gap={2} flexWrap="wrap" textStyle="bodyM" justifyContent="flex-end">
        <HStack alignItems="center" gap="2">
          <VTHOBalance balance={gasFees.totalFeePaid} />
          <Image src="/icons/success.svg" alt="check mark" width={16} height={16} />
        </HStack>
        <HStack alignItems="center" gap={2}>
          <Text textTransform="lowercase">{t('By')}</Text>
          <CopyableAddressLink address={gasPayer} truncate />
        </HStack>
      </Flex>
    )
  }

  return <VTHOBalance balance={gasFees.totalFeePaid} />
}

export const GasUsed = ({ gasUsed, gasLimit }: { gasUsed: bigint; gasLimit: bigint }) => {
  const formatNumber = useFormatNumber()
  const gasUsedRatio = gasLimit === 0n ? 0 : (Number(gasUsed) / Number(gasLimit)) * 100

  return (
    <Flex direction={{ base: 'column', md: 'row' }} alignItems={{ base: 'flex-end', md: 'center' }} gap={2}>
      <Text textStyle="bodyS" color="text-alt-secondary" whiteSpace="nowrap">
        {formatNumber(Number(gasUsed))} / {formatNumber(Number(gasLimit))}
      </Text>
      <Flex alignItems="center" gap={1}>
        <Progress.Root size="xs" rounded="full" w="20" value={gasUsedRatio}>
          <Progress.Track bgColor="bg-card-surface-2" shadow="none">
            <Progress.Range bgColor="accent-secondary" rounded="full" />
          </Progress.Track>
        </Progress.Root>
        <Text textStyle="bodyS" color="text-alt" whiteSpace="nowrap">
          {`${gasUsedRatio.toFixed(0)}%`}
        </Text>
      </Flex>
    </Flex>
  )
}
