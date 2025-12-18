'use client'

import { Flex, Grid, GridItem, Heading, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { DataCard } from '@/components/ui/DataCard'
import { AddressLink } from '@/components/ui/Links'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Surface } from '@/components/ui/Surface'
import type { Transaction, TransactionReceipt } from '@/lib/schemas'
import { GasUsed, TxFeePaid, TxGasFees, useTxGasFees } from './ui/GasFees'

export const TransactionInsight = ({
  transaction,
  receipt,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
}) => {
  const { t } = useTranslation()
  const status = receipt ? (receipt.reverted ? 'reverted' : 'success') : 'pending'
  const gasUsed = receipt?.gasUsed ?? BigInt(0)
  const gasLimit = transaction.gas

  const gasFees = useTxGasFees({ transaction, gasUsed })

  const transactionInsights = [
    {
      label: t('Age'),
      value: <AgeText timestamp={transaction.meta.blockTimestamp} />,
    },
    {
      label: t('Gas Fee'),
      value: <TxGasFees gasFees={gasFees} />,
    },
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={gasUsed} gasLimit={gasLimit} />,
    },
    {
      label: t('Fee Paid'),
      value: <TxFeePaid gasFees={gasFees} />,
    },
    {
      label: t('Size'),
      value: `${transaction.size.toLocaleString()} B`,
    },
  ]

  return (
    <Surface bg="bg-alt-primary" borderColor="transparent">
      <Flex alignItems="center" justifyContent="space-between">
        <Heading as="h2" textStyle="displayXs">
          {t('Transaction Insights')}
        </Heading>
        <StatusBadge status={status} />
      </Flex>
      <Flex alignItems="center" flexDirection={{ base: 'column', md: 'row' }} gap="4">
        <Flex
          flex="1"
          flexDirection="column"
          alignSelf="stretch"
          rounded="md"
          border="1px solid"
          textStyle="bodyM"
          borderColor="border-primary"
        >
          {transactionInsights.map(insight => (
            <Flex
              key={insight.label}
              py="4"
              px="6"
              flex="1"
              alignItems="center"
              borderBottom="1px solid var(--chakra-colors-border-primary)"
              css={{ '&:last-child': { borderBottom: 'none' } }}
            >
              <Text width="130px">{insight.label}</Text>
              {insight.value}
            </Flex>
          ))}
        </Flex>
        <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} flex="1" alignSelf="stretch" gap="4">
          {/* //TODO: Add relevant data to data cards */}
          <GridItem colSpan={{ base: 1, md: 2 }} display="flex">
            <DataCard
              icon={<Image src="/icons/clause.svg" alt="Total transfers" />}
              title={t('Total transfers')}
              tooltip={t('Information coming soon')}
            >
              <Text textStyle="bodyL">
                {'123.456'} {t('B3TR')}
              </Text>
              <Flex justifyContent="space-between" gap="2">
                {/* //TODO: Handle transfers here. For now, this is just a placeholder */}
                <AddressLink address={transaction.origin} truncate />
                <Image src="/icons/transaction.svg" alt="Transfer" width={12} height={12} />
                <AddressLink address={transaction.origin} truncate />
              </Flex>
            </DataCard>
          </GridItem>

          <DataCard
            icon={<Image src="/icons/clock.svg" alt="Expiration" />}
            title={t('Expiration')}
            tooltip={t('Information coming soon')}
          >
            <Text>
              {transaction.expiration.toLocaleString()} {t('Blocks')}
            </Text>
          </DataCard>

          <DataCard
            icon={<Image src="/icons/link.svg" alt="Chain Tag" />}
            title={t('Chain Tag')}
            tooltip={t('Information coming soon')}
          >
            <Text>{transaction.chainTag.toLocaleString()}</Text>
          </DataCard>
        </Grid>
      </Flex>
    </Surface>
  )
}
