import { type Transaction, transactionTypeSchema } from '@/lib/schemas/transactions'
import { useBaseFeePerGas, useLegacyBaseFeePerGas } from '@/services/thor/hooks'
import BigNumber from 'bignumber.js'
import type { TransactionReceipt } from '@/lib/schemas'
import { formatGwei } from 'viem'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { InsightType } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import { GasUsed, TxFeePaid } from '@/components/ui/GasFees'
import { HStack, Text } from '@chakra-ui/react'
import { formatPercentage } from '@/lib/utils/units'

export type TxGasFeesResult =
  | {
      type: 'loading'
    }
  | {
      type: 'legacy'
      gasPriceCoef: number
      legacyBaseFeePerGas: bigint
      totalFeePaid: bigint
    }
  | {
      type: 'dynamic'
      maxFeePerGas: bigint
      priorityFeePerGas: bigint
      totalFeePaid: bigint
    }

export const useTransactionGasInsights = ({
  transaction,
  receipt,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
}): InsightType[] => {
  const txGasFees = useTxGasFees({ transaction, receipt })
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const transactionGasInsights = [
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={receipt?.gasUsed ?? BigInt(0)} gasLimit={transaction.gas} />,
    },
    {
      label: t('Fee Paid'),
      value: <TxFeePaid gasFees={txGasFees} gasPayer={receipt?.gasPayer ?? null} />,
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
      {
        label: t('Base Fee per Gas'),
        value: `${formatNumber(Number(formatGwei(txGasFees.legacyBaseFeePerGas)))} Gwei`,
      },
    ]
  }

  if (txGasFees.type === 'dynamic') {
    return [
      ...transactionGasInsights,
      {
        label: t('Max Fee per Gas'),
        value: `${formatNumber(Number(formatGwei(txGasFees.maxFeePerGas)))} Gwei`,
      },
      {
        label: t('Priority Fee per Gas'),
        value: `${formatNumber(Number(formatGwei(txGasFees.priorityFeePerGas)))} Gwei`,
      },
    ]
  }

  return []
}

const useTxGasFees = ({
  transaction,
  receipt,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
}): TxGasFeesResult => {
  const totalFeePaid = receipt?.paid ?? BigInt(0)

  const { isLoading: isBaseFeePerGasLoading, data: baseFeePerGas } = useBaseFeePerGas(transaction?.meta.blockID)
  const { isLoading: isLegacyBaseFeePerGasLoading, data: legacyBaseFeePerGas } = useLegacyBaseFeePerGas()

  if (isBaseFeePerGasLoading || !baseFeePerGas || isLegacyBaseFeePerGasLoading || !legacyBaseFeePerGas)
    return { type: 'loading' }

  const isDynamicFee = transaction.type === transactionTypeSchema.enum.DYNAMIC_FEE

  if (isDynamicFee) {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction

    return {
      type: 'dynamic',
      maxFeePerGas,
      priorityFeePerGas: calculatePriorityFeePerGas({ maxPriorityFeePerGas, maxFeePerGas, baseFeePerGas }),
      totalFeePaid,
    }
  }

  const gasPriceCoef = transaction.gasPriceCoef

  return {
    type: 'legacy',
    gasPriceCoef,
    legacyBaseFeePerGas: legacyBaseFeePerGas,
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
  if (maxPriorityFeePerGas + baseFeePerGas > maxFeePerGas) {
    const priorityFeePerGas = new BigNumber(maxFeePerGas).minus(baseFeePerGas).toString()
    return BigInt(priorityFeePerGas)
  }

  const priorityFeePerGas = new BigNumber(maxPriorityFeePerGas).toString()
  return BigInt(priorityFeePerGas)
}
