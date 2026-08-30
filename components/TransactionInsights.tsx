'use client'

import { Alert, Badge, Box, Heading, Skeleton, Text, VStack } from '@chakra-ui/react'
import { LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { CONFIRMATIONS_CAP, isConfirmationsSettled } from '@/lib/confirmations'
import type { NetworkName } from '@/lib/constants/network'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { useTransactionGasInsights } from '@/hooks/useTransactionGasInsights'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { useFormatNumber } from '@/hooks/useFormatting'
import { useBestBlockCompressed } from '@/services/thor/block'
import { useTransactionFailureInsight } from '@/services/thor/transaction'

export const TransactionInsight = ({
  transaction,
  receipt,
  networkName,
  expert = true,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
  networkName?: NetworkName
  // When false, only the revert / mismatch alerts render. The
  // technical-details grid and fees/gas breakdown stay hidden until
  // the user opts into expert mode.
  expert?: boolean
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  // The card below is expert-only and stops moving past the cap, so the head is read only
  // when it is both on screen and still able to change the number.
  const settled = isConfirmationsSettled(transaction.meta.blockTimestamp)
  const { data: bestBlock, isPending: isBestBlockPending } = useBestBlockCompressed(networkName, {
    enabled: expert && !settled,
  })
  const isReverted = receipt?.reverted ?? false
  const { data: failureInsight } = useTransactionFailureInsight(transaction, isReverted, networkName)
  const revertReason = failureInsight?.revertReason
  const possibleSelectorMismatch = failureInsight?.possibleSelectorMismatch

  const feeAndGasInsights = useTransactionGasInsights({
    transaction,
    receipt,
    networkName,
  })

  const confirmations = settled ? CONFIRMATIONS_CAP : getConfirmations(bestBlock?.number, transaction.meta.blockNumber)
  const confirmationsStatus = getConfirmationsStatus(confirmations)

  const additionalInsights: DataCardGroupItem[] = [
    {
      title: t('Confirmations'),
      children: (
        <Box>
          {isBestBlockPending && !settled ? (
            <Skeleton width="52px" height="29px" rounded="full" />
          ) : (
            <Badge
              textStyle="bodyM"
              minWidth="30px"
              justifyContent="center"
              bg={`${confirmationsStatus}-surface`}
              color={`${confirmationsStatus}-text`}
              gap="1"
              py="1"
              px="2"
              rounded="full"
              flexShrink={1}
            >
              {confirmations !== undefined && confirmations >= CONFIRMATIONS_CAP && <LuChevronRight />}
              {confirmations}
            </Badge>
          )}
        </Box>
      ),
    },
    {
      title: t('Size'),
      children: <Text>{formatNumber(transaction.size)} B</Text>,
    },
    {
      title: t('Expiration'),
      children: (
        <Text>
          {formatNumber(transaction.expiration)} {t('Blocks')}
        </Text>
      ),
    },
    {
      title: 'Nonce',
      children: <Text color="text-secondary">{transaction.nonce}</Text>,
    },
  ]
  const feeAndGasItems: DataCardGroupItem[] = feeAndGasInsights.map(insight => ({
    title: insight.label,
    children: insight.value,
  }))

  return (
    <VStack alignItems="stretch" gap="4">
      {isReverted && revertReason && (
        <Alert.Root status="error" alignItems="flex-start">
          <Alert.Indicator />
          <Alert.Content minW="0">
            <Alert.Title>{t('Revert Reason')}</Alert.Title>
            <Alert.Description wordBreak="break-all" whiteSpace="normal">
              {revertReason}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {isReverted && possibleSelectorMismatch && (
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('Possible selector mismatch')}</Alert.Title>
            <Alert.Description>
              {t(
                'Clause #{{index}} with selector {{selector}} reverted immediately without a decoded reason. This often means the calldata was encoded with an outdated ABI or wrong function signature.',
                {
                  index: possibleSelectorMismatch.clauseIndex + 1,
                  selector: possibleSelectorMismatch.selector,
                },
              )}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {expert && (
        <>
          <DataCardGroup
            singleCard
            variant="outline"
            items={[
              {
                title: t('Type'),
                children: <TxTypeBadge type={transaction.type} />,
              },
              ...additionalInsights,
            ]}
          />
          {feeAndGasItems.length > 0 && (
            <VStack alignItems="stretch" gap="3">
              <Heading as="h3" textStyle="bodyL" color="text-primary">
                {t('Fees, Gas and VTHO')}
              </Heading>
              <DataCardGroup singleCard variant="outline" items={feeAndGasItems} />
            </VStack>
          )}
        </>
      )}
    </VStack>
  )
}

function getConfirmations(bestBlockNumber: number | undefined, transactionBlockNumber: number) {
  if (bestBlockNumber === undefined) return undefined

  const confirmations = bestBlockNumber - transactionBlockNumber

  return confirmations > 12 ? 12 : confirmations
}

function getConfirmationsStatus(confirmations: number | undefined) {
  if (confirmations === undefined) return 'error'

  if (confirmations === 12) return 'success'

  return 'pending'
}
