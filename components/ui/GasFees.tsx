import { AbsoluteCenter, Flex, ProgressCircle, Text } from '@chakra-ui/react'
import { formatGwei } from 'viem'
import { type Transaction, transactionTypeSchema } from '@/lib/schemas/transactions'
import { useBaseFeePerGas, useLegacyBaseFeePerGas } from '@/services/thor/hooks'

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

export const TxFeePaid = ({ gasFees }: { gasFees: TxGasFeesResult }) => {
  if (gasFees.type === 'loading') return <Text>Loading...</Text>
  return <Text>{`${formatGwei(gasFees.totalPaid)} Gwei`}</Text>
}

export const GasUsed = ({ gasUsed, gasLimit }: { gasUsed: bigint; gasLimit: bigint }) => {
  const gasUsedRatio = (Number(gasUsed) / Number(gasLimit)) * 100

  return (
    <Flex alignItems="center" gap={2}>
      <ProgressCircle.Root size="sm" value={gasUsedRatio} colorPalette="teal">
        <ProgressCircle.Circle css={{ '--thickness': '3px' }}>
          <ProgressCircle.Track />
          <ProgressCircle.Range strokeLinecap="round" />
        </ProgressCircle.Circle>
        <AbsoluteCenter>
          <ProgressCircle.ValueText fontSize="xxs" />
        </AbsoluteCenter>
      </ProgressCircle.Root>
      <Text>{[gasUsed.toLocaleString(), gasLimit.toLocaleString()].join(' / ')}</Text>
    </Flex>
  )
}
