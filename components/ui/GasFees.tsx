'use client'

import { Flex, Progress, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { formatGwei } from 'viem'
import { type Transaction, transactionTypeSchema } from '@/lib/schemas/transactions'
import { useBaseFeePerGas, useLegacyBaseFeePerGas } from '@/services/thor/hooks'
import { InfoTip } from './InfoTip'
import { AddressString } from '@/lib/schemas/common'
import { VTHOBalance } from './Balance'
import { AddressLink } from './Links'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatting'

type TxGasFeesResult =
  | {
      type: 'loading'
    }
  | {
      type: 'dynamic'
      maxFeePerGas: bigint
      priorityFeePerGas: bigint
      totalPaid: bigint
    }
  | {
      type: 'legacy'
      totalGasFeePerGas: bigint
      totalPaid: bigint
    }

export const useTxGasFees = ({
  transaction,
  gasUsed,
}: {
  transaction: Transaction
  gasUsed: bigint
}): TxGasFeesResult => {
  const baseFeePerGasQuery = useBaseFeePerGas(transaction?.meta.blockID)
  const legacyBaseFeePerGasQuery = useLegacyBaseFeePerGas()

  if (
    baseFeePerGasQuery.isLoading ||
    !baseFeePerGasQuery.data ||
    legacyBaseFeePerGasQuery.isLoading ||
    !legacyBaseFeePerGasQuery.data
  )
    return { type: 'loading' }

  const isDynamicFee = transaction.type === transactionTypeSchema.enum.DYNAMIC_FEE

  if (isDynamicFee) {
    const baseFeePerGas = baseFeePerGasQuery.data
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction

    let priorityFeePerGas = maxPriorityFeePerGas

    if (maxPriorityFeePerGas + baseFeePerGas > maxFeePerGas) {
      priorityFeePerGas = maxFeePerGas - baseFeePerGas
    }

    const totalGasFeePerGas = baseFeePerGas + priorityFeePerGas

    return {
      type: 'dynamic',
      maxFeePerGas,
      priorityFeePerGas,
      totalPaid: totalGasFeePerGas * BigInt(gasUsed),
    }
  }

  const gasPriceCoef = BigInt(transaction.gasPriceCoef)
  const legacyBaseFeePerGas = legacyBaseFeePerGasQuery.data

  return {
    type: 'legacy',
    totalGasFeePerGas: legacyBaseFeePerGas,
    totalPaid: legacyBaseFeePerGas + gasPriceCoef * BigInt(gasUsed),
  }
}

export const TxGasFees = ({ gasFees }: { gasFees: TxGasFeesResult }) => {
  if (gasFees.type === 'loading') return <Text>Loading...</Text>

  if (gasFees.type === 'dynamic') {
    return (
      <Text>{`${formatGwei(gasFees.maxFeePerGas)} Gwei (max) - ${formatGwei(gasFees.priorityFeePerGas)} Gwei (prior)`}</Text>
    )
  }

  if (gasFees.type === 'legacy') {
    return <Text>{`${formatGwei(gasFees.totalGasFeePerGas)} Gwei`}</Text>
  }

  return null
}

export const TxFeePaid = ({ gasFees, gasPayer }: { gasFees: TxGasFeesResult; gasPayer: AddressString | null }) => {
  const { t } = useTranslation()

  if (gasFees.type === 'loading') return <Skeleton h="20px" w="80px" />

  if (gasPayer) {
    return (
      <Flex alignItems="center" gap={2} flexWrap="wrap" textStyle="bodyM">
        <VTHOBalance balance={gasFees.totalPaid} />
        <Flex alignItems="center" gap={2}>
          <Image src="/icons/success.svg" alt="chek mark" width={16} height={16} />
          <Text textTransform="lowercase">{t('By')}</Text>
          <AddressLink address={gasPayer} truncate />
        </Flex>
      </Flex>
    )
  }

  return <VTHOBalance balance={gasFees.totalPaid} />
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
