'use client'

import { Alert, Badge, Box, Heading, Skeleton, Text, VStack } from '@chakra-ui/react'
import { LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import type { NetworkName } from '@/lib/constants/network'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { useTransactionGasInsights } from '@/hooks/useTransactionGasInsights'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { useFormatNumber } from '@/hooks/useFormatting'
import { useBestBlockCompressed } from '@/services/thor/block'
import { useRevertReason } from '@/services/thor/transaction'

export const TransactionInsight = ({
  transaction,
  receipt,
  networkName,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
  networkName?: NetworkName
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const { data: bestBlock, isPending: isBestBlockPending } = useBestBlockCompressed(networkName)
  const isReverted = receipt?.reverted ?? false
  const { data: revertReason } = useRevertReason(transaction, isReverted, networkName)

  const feeAndGasInsights = useTransactionGasInsights({
    transaction,
    receipt,
    networkName,
  })

  const confirmations = getConfirmations(bestBlock?.number, transaction.meta.blockNumber)
  const confirmationsStatus = getConfirmationsStatus(confirmations)

  const additionalInsights: DataCardGroupItem[] = [
    {
      title: t('Confirmations'),
      children: (
        <Box>
          {isBestBlockPending ? (
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
              {confirmations && confirmations >= 12 && <LuChevronRight />}
              {getConfirmations(bestBlock?.number, transaction.meta.blockNumber)}
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
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('Revert Reason')}</Alert.Title>
            <Alert.Description>{revertReason}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
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
