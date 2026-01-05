'use client'

import { Flex, Progress, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'

import { InfoTip } from './InfoTip'
import { AddressString } from '@/lib/schemas/common'
import { VTHOBalance } from './Balance'
import { AddressLink } from './Links'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { TxGasFeesResult } from '@/hooks/useTransactionGasInsights'

export const TxFeePaid = ({ gasFees, gasPayer }: { gasFees: TxGasFeesResult; gasPayer: AddressString | null }) => {
  const { t } = useTranslation()

  if (gasFees.type === 'loading') return <Skeleton h="20px" w="80px" />

  if (gasPayer) {
    return (
      <Flex alignItems="center" gap={2} flexWrap="wrap" textStyle="bodyM">
        <VTHOBalance balance={gasFees.totalFeePaid} />
        <Flex alignItems="center" gap={2}>
          <Image src="/icons/success.svg" alt="check mark" width={16} height={16} />
          <Text textTransform="lowercase">{t('By')}</Text>
          <AddressLink address={gasPayer} truncate />
        </Flex>
      </Flex>
    )
  }

  return <VTHOBalance balance={gasFees.totalFeePaid} />
}

export const GasUsed = ({ gasUsed, gasLimit }: { gasUsed: bigint; gasLimit: bigint }) => {
  const formatNumber = useFormatNumber()
  const gasUsedRatio = (Number(gasUsed) / Number(gasLimit)) * 100

  return (
    <Flex alignItems="start" gap={2}>
      <Progress.Root size="xs" rounded="full" w="20" value={gasUsedRatio} formatOptions={{ style: 'percent' }}>
        <Progress.Track bgColor="bg-card-surface-2" shadow="none">
          <Progress.Range bgColor="accent-secondary" rounded="full" />
        </Progress.Track>
        <Progress.Label textStyle="bodyS" color="text-alt">
          {`${gasUsedRatio.toFixed(0)}%`}
        </Progress.Label>
      </Progress.Root>
      <InfoTip tooltip={[formatNumber(Number(gasUsed)), formatNumber(Number(gasLimit))].join(' / ')} />
    </Flex>
  )
}
