import { type Transaction, transactionTypeSchema } from '@/lib/schemas/transactions'
import type { NetworkName } from '@/lib/constants/network'
import { useBaseFeePerGas } from '@/services/thor/block'
import { useLegacyBaseFeePerGas } from '@/services/thor/transaction'
import type { TransactionReceipt } from '@/lib/schemas'
import { formatGwei } from 'viem'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { InsightType } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import { GasUsed, TxFeePaid } from '@/components/ui/GasFees'
import { HStack, Skeleton, Stack, Text } from '@chakra-ui/react'
import { formatPercentage } from '@/lib/utils/units'
import { VTHOBalanceWithFiat } from '@/components/ui/Balance'

export type TxGasFeesResult =
  | {
      type: 'loading'
    }
  | {
      type: 'legacy'
      gasPriceCoef: number
      baseFeePerGas: bigint
      gasPrice: bigint
      totalFeePaid: bigint
    }
  | {
      type: 'dynamic'
      maxFeePerGas: bigint
      priorityFeePerGas: bigint
      baseFeePerGas: bigint
      gasPrice: bigint
      totalFeePaid: bigint
    }

export const useTransactionGasInsights = ({
  transaction,
  receipt,
  networkName,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
  networkName?: NetworkName
}): InsightType[] => {
  const txGasFees = useTxGasFees({ transaction, receipt, networkName })
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const transactionGasInsights = [
    {
      label: t('Fee Paid'),
      value: <TxFeePaid gasFees={txGasFees} gasPayer={receipt?.gasPayer ?? null} />,
    },
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={receipt?.gasUsed ?? BigInt(0)} gasLimit={transaction.gas} />,
    },
    {
      label: t('Gas Price'),
      value:
        txGasFees.type === 'loading' ? (
          <Skeleton h="20px" w="80px" />
        ) : (
          `${formatNumber(Number(formatGwei(txGasFees.gasPrice)))} Gwei`
        ),
    },
    {
      label: t('Base Fee per Gas'),
      value:
        txGasFees.type === 'loading' ? (
          <Skeleton h="20px" w="80px" />
        ) : (
          `${formatNumber(Number(formatGwei(txGasFees.baseFeePerGas)))} Gwei`
        ),
    },
  ]
  const vthoInsights = [
    {
      label: t('VTHO Rewarded'),
      value: <VTHOBalanceWithFiat balance={receipt?.reward ?? BigInt(0)} />,
    },
    {
      label: t('VTHO Burned'),
      value: <VTHOBalanceWithFiat balance={BigInt(receipt?.paid ?? 0) - BigInt(receipt?.reward ?? 0)} />,
    },
  ]

  if (txGasFees.type === 'legacy') {
    return [
      ...transactionGasInsights,
      {
        label: t('Gas Price Coef'),
        value: (
          <HStack alignItems="center" gap="8">
            <Text>
              {txGasFees.gasPriceCoef} {'/ 255'}
            </Text>
            <Text color="text-alt-secondary">{formatPercentage((txGasFees.gasPriceCoef / 255) * 100)}</Text>
          </HStack>
        ),
      },
      ...vthoInsights,
    ]
  }

  if (txGasFees.type === 'dynamic') {
    return [
      ...transactionGasInsights,
      {
        label: t('Priority Fee per Gas'),
        value: (
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'flex-end', md: 'center' }}
            gap={{ base: 2, md: 4 }}
          >
            <Text>
              {formatNumber(Number(formatGwei(txGasFees.priorityFeePerGas)))} {' Gwei'}
            </Text>
            <Text color="text-alt-secondary">
              {'Max :'} {formatNumber(Number(formatGwei(txGasFees.maxFeePerGas)))} {'Gwei'}
            </Text>
          </Stack>
        ),
      },
      ...vthoInsights,
    ]
  }

  return []
}

const useTxGasFees = ({
  transaction,
  receipt,
  networkName,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
  networkName?: NetworkName
}): TxGasFeesResult => {
  const totalFeePaid = receipt?.paid ?? BigInt(0)

  const { isLoading: isBaseFeePerGasLoading, data: baseFeePerGas } = useBaseFeePerGas(
    transaction?.meta.blockID,
    networkName,
  )
  const { isLoading: isLegacyBaseFeePerGasLoading, data: legacyBaseFeePerGas } = useLegacyBaseFeePerGas(networkName)

  if (isBaseFeePerGasLoading || !baseFeePerGas || isLegacyBaseFeePerGasLoading || !legacyBaseFeePerGas)
    return { type: 'loading' }

  const isDynamicFee = transaction.type === transactionTypeSchema.enum.DYNAMIC_FEE

  if (isDynamicFee) {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction
    const priorityFeePerGas = calculatePriorityFeePerGas({ maxPriorityFeePerGas, maxFeePerGas, baseFeePerGas })

    return {
      type: 'dynamic',
      maxFeePerGas,
      priorityFeePerGas,
      baseFeePerGas,
      gasPrice: baseFeePerGas + priorityFeePerGas,
      totalFeePaid,
    }
  }

  const gasPriceCoef = transaction.gasPriceCoef

  return {
    type: 'legacy',
    gasPriceCoef,
    baseFeePerGas: legacyBaseFeePerGas,
    gasPrice: (legacyBaseFeePerGas * BigInt(255 + gasPriceCoef)) / BigInt(255),
    totalFeePaid,
  }
}

function calculatePriorityFeePerGas({
  maxPriorityFeePerGas,
  maxFeePerGas,
  baseFeePerGas,
}: {
  maxPriorityFeePerGas: bigint
  maxFeePerGas: bigint
  baseFeePerGas: bigint
}): bigint {
  let effectiveGasPrice = baseFeePerGas + maxPriorityFeePerGas

  if (effectiveGasPrice > maxFeePerGas) {
    effectiveGasPrice = maxFeePerGas
  }

  return effectiveGasPrice - baseFeePerGas
}
