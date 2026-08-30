'use client'

import { Badge, Box, Skeleton } from '@chakra-ui/react'
import { LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { VETBalance } from '@/components/ui/Balance'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { useTransactionGasInsights } from '@/hooks/useTransactionGasInsights'
import { CONFIRMATIONS_CAP, confirmationsToShow, isConfirmationsSettled } from '@/lib/confirmations'
import type { NetworkName } from '@/lib/constants/network'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { useBestBlockCompressed } from '@/services/thor/block'

/**
 * Lean 3-up overview shown above the activity card on every tx page,
 * regardless of expert mode. The only accented figure is the fee — that's
 * the one number most users actually want.
 */
export const TransactionOverview = ({
  transaction,
  receipt,
  networkName,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
  networkName?: NetworkName
}) => {
  const { t } = useTranslation()
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const status: 'success' | 'reverted' | 'pending' = receipt ? (receipt.reverted ? 'reverted' : 'success') : 'pending'

  // Only a confirmation count reads the head, and past the cap it stops moving — the other
  // two badges are fixed text.
  const settled = isConfirmationsSettled(transaction.meta.blockTimestamp, networkName ?? activeNetworkName)
  const { data: bestBlock } = useBestBlockCompressed(networkName, {
    enabled: status === 'success' && !settled,
  })
  const feeAndGasInsights = useTransactionGasInsights({ transaction, receipt, networkName })

  // Sum of clause-attached VET (most txs have a single clause; multi-clause
  // value-bearing flows like swaps still sum to a meaningful total).
  const valueTransferred = transaction.clauses.reduce((acc, c) => acc + c.value, BigInt(0))

  // Pull the formatted Fee Paid value out of the gas-insights array so we
  // share the same renderer as the expert-mode breakdown below.
  const feePaidNode = feeAndGasInsights.find(i => i.label === t('Fee Paid'))?.value ?? <Skeleton h="20px" w="80px" />

  const statusBadge = renderStatusBadge({
    status,
    confirmations: confirmationsToShow({
      settled,
      bestBlockNumber: bestBlock?.number,
      transactionBlockNumber: transaction.meta.blockNumber,
    }),
    successLabel: t('Confirmations'),
    revertedLabel: t('Reverted'),
    pendingLabel: t('Pending'),
  })

  const items: DataCardGroupItem[] = [
    {
      title: t('Value transferred'),
      children: <VETBalance balance={valueTransferred} />,
    },
    {
      title: t('Fee Paid'),
      children: feePaidNode,
    },
    {
      title: t('Status'),
      children: statusBadge,
    },
  ]

  return <DataCardGroup variant="outline" singleCard desktopColumns={3} items={items} />
}

const renderStatusBadge = ({
  status,
  confirmations,
  successLabel,
  revertedLabel,
  pendingLabel,
}: {
  status: 'success' | 'reverted' | 'pending'
  confirmations: number | undefined
  successLabel: string
  revertedLabel: string
  pendingLabel: string
}) => {
  if (status === 'reverted') {
    return (
      <Badge bg="error-surface" color="error-text" px="2" py="1" rounded="full" textStyle="bodyM">
        {revertedLabel}
      </Badge>
    )
  }

  if (status === 'pending') {
    return (
      <Badge bg="pending-surface" color="pending-text" px="2" py="1" rounded="full" textStyle="bodyM">
        {pendingLabel}
      </Badge>
    )
  }

  if (confirmations === undefined) {
    return (
      <Box>
        <Skeleton width="80px" height="24px" rounded="full" />
      </Box>
    )
  }

  const palette = confirmations === CONFIRMATIONS_CAP ? 'success' : 'pending'

  return (
    <Badge bg={`${palette}-surface`} color={`${palette}-text`} px="2" py="1" rounded="full" textStyle="bodyM" gap="1">
      {confirmations >= CONFIRMATIONS_CAP && <LuChevronRight />}
      {confirmations} {successLabel.toLowerCase()}
    </Badge>
  )
}
