'use client'

import { Alert, Badge, Box, Flex, Heading, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import Image from 'next/image'
import { LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { AddressLink } from '@/components/ui/Links'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { useTransactionGasInsights } from '@/hooks/useTransactionGasInsights'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useIsMobile } from '@/hooks/useIsMobile'
import { VETBalance } from './ui/Balance'
import BigNumber from 'bignumber.js'
import { useBestBlockCompressed, useRevertReason } from '@/services/thor/hooks'
import { InsightType, TransactionStatus } from '@/lib/types'
import { TxStatusBadge } from './TxStatus'

export const TransactionInsight = ({
  transaction,
  receipt,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const isMobile = useIsMobile()

  const { data: bestBlock, isPending: isBestBlockPending } = useBestBlockCompressed()
  const isReverted = receipt?.reverted ?? false
  const { data: revertReason } = useRevertReason(transaction, isReverted)

  const transactionGasInsights = useTransactionGasInsights({
    transaction,
    receipt,
  })

  const transactionInsights: InsightType[] = [
    {
      label: t('Origin'),
      value: <AddressLink address={transaction.origin} truncate />,
    },
    {
      label: t('Type'),
      value: <TxTypeBadge type={transaction.type} />,
    },
    ...transactionGasInsights,
    {
      label: t('Size'),
      value: `${formatNumber(transaction.size)} B`,
    },
  ]

  const status = receipt
    ? isReverted
      ? TransactionStatus.REVERTED
      : TransactionStatus.SUCCESS
    : TransactionStatus.PENDING

  const confirmations = getConfirmations(bestBlock?.number, transaction.meta.blockNumber)
  const confirmationsStatus = getConfirmationsStatus(confirmations)
  const VETValue = BigInt(
    transaction.clauses.reduce((acc, clause) => acc.plus(clause.value), new BigNumber(0)).toFixed(0),
  )

  const TransactionDate = () => {
    return <Text color="text-secondary">{formatDate(transaction.meta.blockTimestamp)}</Text>
  }

  const additionalInsights: DataCardGroupItem[] = [
    {
      icon: <Image src="/icons/vet-value.svg" alt="Value" />,
      title: t('Value'),
      children: <VETBalance balance={VETValue} justifyContent="flex-start" />,
    },
    {
      icon: <Image src="/icons/confirmations.svg" alt="Confirmations" />,
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
      icon: <Image src="/icons/clock.svg" alt="Expiration" />,
      title: t('Expiration'),
      children: (
        <Text>
          {formatNumber(transaction.expiration)} {t('Blocks')}
        </Text>
      ),
    },
    {
      icon: <Image src="/icons/link.svg" alt="Nonce" />,
      title: 'Nonce',
      children: <Text color="text-secondary">{transaction.nonce}</Text>,
    },
  ]

  const mainInsights: DataCardGroupItem[] = transactionInsights.map(insight => ({
    title: insight.label,
    children: insight.value,
  }))

  return (
    <VStack alignItems="stretch" gap="4">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" gapX="2" gapY="4">
        <Heading as="h2" textStyle="displayXs">
          {t('Transaction Insights')}
        </Heading>

        <HStack alignItems="center" justifyContent="space-between" gap="4">
          {!isMobile && <TransactionDate />}
          <TxStatusBadge status={status} />
        </HStack>

        {isMobile && <TransactionDate />}
      </Flex>
      {isReverted && revertReason && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('Revert Reason')}</Alert.Title>
            <Alert.Description>{revertReason}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {isMobile ? (
        <DataCardGroup singleCard variant="outline" items={[...additionalInsights, ...mainInsights]} />
      ) : (
        <Flex alignItems="flex-start" flexDirection="row" gap="4">
          <DataCardGroup singleCard variant="outline" mobileCardProps={{ flex: 1 }} items={mainInsights} />
          <DataCardGroup variant="outline" cardProps={{ minWidth: 'auto' }} singleCard items={additionalInsights} />
        </Flex>
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
