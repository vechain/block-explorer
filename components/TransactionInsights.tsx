'use client'

import { Fragment } from 'react'
import { Badge, Box, Flex, Grid, Heading, HStack, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { AddressLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { useTransactionGasInsights } from '@/hooks/useTransactionGasInsights'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useIsMobile } from '@/hooks/useIsMobile'
import { VETBalance } from './ui/Balance'
import BigNumber from 'bignumber.js'
import { useBestBlockCompressed } from '@/services/thor/hooks'
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
    ? receipt.reverted
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

  return (
    <Card variant="tertiary">
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

      <Flex alignItems="start" flexDirection={{ base: 'column', md: 'row' }} gap="4" justifyContent="normal">
        <Grid
          flex="1"
          rounded="md"
          border="1px solid"
          textStyle="bodyM"
          borderColor="border-primary"
          templateColumns="auto auto"
        >
          {transactionInsights.map((insight, index) => (
            <Fragment key={insight.label}>
              <Flex
                alignItems="center"
                py="4"
                pl="4"
                pr="2"
                flexWrap="wrap"
                borderBottom={
                  index !== transactionInsights.length - 1 ? '1px solid var(--chakra-colors-border-primary)' : 'none'
                }
              >
                <Text>{insight.label}</Text>
              </Flex>
              <Flex
                alignItems="center"
                py="4"
                pr="4"
                pl="2"
                flexWrap="wrap"
                borderBottom={
                  index !== transactionInsights.length - 1 ? '1px solid var(--chakra-colors-border-primary)' : 'none'
                }
              >
                {insight.value}
              </Flex>
            </Fragment>
          ))}
        </Grid>

        <Flex flex="1" gap="4" alignItems="stretch" flexWrap="wrap">
          <DataCard
            minWidth={{ base: '100%', md: '45%' }}
            icon={<Image src="/icons/vet-value.svg" alt="Expiration" />}
            title={t('Value')}
          >
            <VETBalance balance={VETValue} justifyContent="flex-start" />
          </DataCard>

          <DataCard
            minWidth={{ base: '100%', md: '45%' }}
            icon={<Image src="/icons/confirmations.svg" alt="Expiration" />}
            title={t('Confirmations')}
          >
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
          </DataCard>

          <DataCard
            minWidth={{ base: '100%', md: '45%' }}
            icon={<Image src="/icons/clock.svg" alt="Expiration" />}
            title={t('Expiration')}
          >
            <Text>
              {formatNumber(transaction.expiration)} {t('Blocks')}
            </Text>
          </DataCard>

          <DataCard
            minWidth={{ base: '100%', md: '45%' }}
            icon={<Image src="/icons/link.svg" alt="Chain Tag" />}
            title="Nonce"
          >
            <Text color="text-secondary">{transaction.nonce}</Text>
          </DataCard>
        </Flex>
      </Flex>
    </Card>
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
