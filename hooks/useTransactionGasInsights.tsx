import { type Transaction, transactionTypeSchema } from '@/lib/schemas/transactions'
import { useBaseFeePerGas, useLegacyBaseFeePerGas } from '@/services/thor/hooks'
import BigNumber from 'bignumber.js'
import type { AddressString } from '@/lib/schemas'
import { formatGwei } from 'viem'
import { formatNumber } from '@/lib/utils/units'
import type { InsightType } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import { GasUsed, TxFeePaid } from '@/components/ui/GasFees'

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
  gasUsed,
  gasPayer,
}: {
  transaction: Transaction
  gasUsed: bigint
  gasPayer: AddressString | null
}): InsightType[] => {
  const txGasFees = useTxGasFees({ transaction, gasUsed })
  const { t } = useTranslation()

  const transactionGasInsights = [
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={gasUsed} gasLimit={transaction.gas} />,
    },
    {
      label: t('Fee Paid'),
      value: <TxFeePaid gasFees={txGasFees} gasPayer={gasPayer} />,
    },
  ]

  if (txGasFees.type === 'legacy') {
    return [
      ...transactionGasInsights,
      {
        label: t('Gas Price Coef'),
        value: `${txGasFees.gasPriceCoef} / 255 -- ${((txGasFees.gasPriceCoef / 255) * 100).toFixed(0)}%`,
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
        value: Number(formatGwei(txGasFees.maxFeePerGas)).toLocaleString() + ' Gwei',
      },
      {
        label: t('Priority Fee per Gas'),
        value: Number(formatGwei(txGasFees.priorityFeePerGas)).toLocaleString() + ' Gwei',
      },
    ]
  }

  return []
}

const useTxGasFees = ({ transaction, gasUsed }: { transaction: Transaction; gasUsed: bigint }): TxGasFeesResult => {
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
      totalFeePaid: calculateDynamicTotalFeePaid({ maxPriorityFeePerGas, maxFeePerGas, baseFeePerGas, gasUsed }),
    }
  }

  const gasPriceCoef = transaction.gasPriceCoef

  return {
    type: 'legacy',
    gasPriceCoef,
    legacyBaseFeePerGas: legacyBaseFeePerGas,
    totalFeePaid: calculateLegacyTotalFeePaid({ gasPriceCoef, legacyBaseFeePerGas, gasUsed }),
  }
}

/**
 * Dynamic transactions
 * */
function calculateDynamicTotalFeePaid({
  maxPriorityFeePerGas,
  maxFeePerGas,
  baseFeePerGas,
  gasUsed,
}: {
  maxPriorityFeePerGas: bigint
  maxFeePerGas: bigint
  baseFeePerGas: bigint
  gasUsed: bigint
}): bigint {
  const totalFeePaid = new BigNumber(calculatePriorityFeePerGas({ maxPriorityFeePerGas, maxFeePerGas, baseFeePerGas }))
    .multipliedBy(gasUsed)
    .toString()

  return BigInt(totalFeePaid)
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

/**
 * Legacy transactions
 * */
function calculateLegacyTotalFeePaid({
  gasPriceCoef,
  legacyBaseFeePerGas,
  gasUsed,
}: {
  gasPriceCoef: number
  legacyBaseFeePerGas: bigint
  gasUsed: bigint
}): bigint {
  const totalFeePaid = new BigNumber(gasPriceCoef / 255 + 1)
    .multipliedBy(gasUsed)
    .multipliedBy(legacyBaseFeePerGas)
    .toString()

  return BigInt(totalFeePaid)
}
