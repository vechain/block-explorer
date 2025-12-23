'use client'

import { Fragment } from 'react'
import { Badge, Box, Flex, Grid, Heading, HStack, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { LuChevronRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { AddressLink } from '@/components/ui/Links'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { GasUsed, TxFeePaid, TxGasFees, useTxGasFees } from './ui/GasFees'
import { TxTypeBadge } from '@/components/ui/TxTypeBadge'
import { formatDateFromTimestamp } from '@/lib/utils/date'
import { useIsMobile } from '@/hooks/useIsMobile'
import { VETBalance } from './ui/Balance'
import BigNumber from 'bignumber.js'
import { useBestBlockCompressed } from '@/services/thor/hooks'

export const TransactionInsight = ({
  transaction,
  receipt,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const status = receipt ? (receipt.reverted ? 'reverted' : 'success') : 'pending'
  const gasUsed = receipt?.gasUsed ?? BigInt(0)
  const gasLimit = transaction.gas

  const gasFees = useTxGasFees({ transaction, gasUsed })
  const { data: bestBlock, isPending: isBestBlockPending } = useBestBlockCompressed()

  const VETValue = BigInt(
    transaction.clauses.reduce((acc, clause) => acc.plus(clause.value), new BigNumber(0)).toString(),
  )

  const transactionInsights = [
    {
      label: t('Origin'),
      value: <AddressLink address={transaction.origin} truncate />,
    },
    {
      // TODO: This section needs to be refined in the designs
      label: t('Gas Price'),
      value: <TxGasFees gasFees={gasFees} />,
    },
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={gasUsed} gasLimit={gasLimit} />,
    },
    {
      label: t('Type'),
      value: <TxTypeBadge type={transaction.type} />,
    },
    {
      label: t('Fee Paid'),
      value: <TxFeePaid gasFees={gasFees} gasPayer={receipt?.gasPayer ?? null} />,
    },
    {
      label: t('Size'),
      value: `${transaction.size.toLocaleString()} B`,
    },
  ]

  const TransactionDate = () => {
    return <Text color="text-secondary">{formatDateFromTimestamp(transaction.meta.blockTimestamp)}</Text>
  }

  const confirmations = getConfirmations(bestBlock?.number, transaction.meta.blockNumber)
  const confirmationsStatus = getConfirmationsStatus(confirmations)

  return (
    <Card variant="secondary">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" gapX="2" gapY="4">
        <Heading as="h2" textStyle="displayXs">
          {t('Transaction Insights')}
        </Heading>

        <HStack alignItems="center" justifyContent="space-between">
          {!isMobile && <TransactionDate />}
          <StatusBadge status={status} />
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
          templateColumns="115px auto"
        >
          {transactionInsights.map((insight, index) => (
            <Fragment key={insight.label}>
              <Flex
                alignItems="center"
                py="4"
                pl="6"
                borderBottom={
                  index !== transactionInsights.length - 1 ? '1px solid var(--chakra-colors-border-primary)' : 'none'
                }
              >
                <Text width="130px">{insight.label}</Text>
              </Flex>
              <Flex
                alignItems="center"
                py="4"
                pr="6"
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
            tooltip={t('Information coming soon')}
          >
            <VETBalance balance={VETValue} justifyContent="flex-start" />
          </DataCard>

          <DataCard
            minWidth={{ base: '100%', md: '45%' }}
            icon={<Image src="/icons/confirmations.svg" alt="Expiration" />}
            title={t('Confirmations')}
            tooltip={t('Information coming soon')}
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
            tooltip={t('Information coming soon')}
          >
            <Text>
              {transaction.expiration.toLocaleString()} {t('Blocks')}
            </Text>
          </DataCard>

          <DataCard
            minWidth={{ base: '100%', md: '45%' }}
            icon={<Image src="/icons/link.svg" alt="Chain Tag" />}
            title="Nonce"
            tooltip={t('Information coming soon')}
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
