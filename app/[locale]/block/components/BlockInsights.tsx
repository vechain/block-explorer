'use client'

import { Flex, Grid, Heading, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { GasUsed } from '@/components/ui/GasFees'
import { Card } from '@/components/ui/Card'
import type { ExpandedBlock } from '@/lib/schemas'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { Fragment } from 'react'
import { TxFeaturesBadge } from '@/components/ui/TxTypeBadge'
import { formatGwei } from 'viem'
import { InsightType } from '@/lib/types'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()

  const blockInsights: InsightType[] = [
    {
      label: t('Type'),
      value: <TxFeaturesBadge features={block.txsFeatures} />,
    },
    {
      label: t('Block Finality'),
      value: block.isFinalized ? t('Finalized') : t('Finalizing'),
    },
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={block.gasUsed} gasLimit={block.gasLimit} />,
    },
    {
      label: t('Gas Limit'),
      value: formatNumber(Number(block.gasLimit)),
    },
    {
      label: t('Base Fee per Gas'),
      value: block.baseFeePerGas ? `${formatNumber(Number(formatGwei(block.baseFeePerGas)))} Gwei` : '-',
    },
    {
      label: t('Transactions'),
      value: formatNumber(block.transactions.length),
    },
  ]

  return (
    <Card variant="secondary">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" gapX="2" gapY="4">
        <Heading as="h2" textStyle="displayXs">
          {t('Block Insights')}
        </Heading>

        <Text color="text-secondary">{formatDate(block.timestamp)}</Text>
      </Flex>

      <Flex alignItems="start" flexDirection={{ base: 'column', md: 'row' }} gap="4" justifyContent="normal">
        <Grid
          flex="1"
          rounded="md"
          border="1px solid"
          textStyle="bodyM"
          borderColor="border-primary"
          templateColumns="160px auto"
        >
          {blockInsights.map((insight, index) => (
            <Fragment key={insight.label}>
              <Flex
                alignItems="center"
                py="4"
                pl="6"
                borderBottom={
                  index !== blockInsights.length - 1 ? '1px solid var(--chakra-colors-border-primary)' : 'none'
                }
              >
                <Text width="130px">{insight.label}</Text>
              </Flex>
              <Flex
                alignItems="center"
                py="4"
                pr="6"
                borderBottom={
                  index !== blockInsights.length - 1 ? '1px solid var(--chakra-colors-border-primary)' : 'none'
                }
                flexWrap="wrap"
              >
                {insight.value}
              </Flex>
            </Fragment>
          ))}
        </Grid>

        <Grid
          templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
          flex="1"
          alignSelf="flex-start"
          gap="4"
          w={{ base: '100%', md: 'auto' }}
        >
          <DataCardGroup
            items={
              [
                {
                  icon: <Image src="/icons/coin.svg" alt="VTHO Paid" width={24} height={24} />,
                  title: t('VTHO Paid'),
                  children: <Text>{'123.456'} VTHO</Text>,
                },
                {
                  icon: <Image src="/icons/flash.svg" alt="VTHO Burned" width={24} height={24} />,
                  title: t('VTHO Burned'),
                  children: <Text>{'123.456'} VTHO</Text>,
                },
                {
                  icon: <Image src="/icons/reward.svg" alt="VTHO Rewarded" width={24} height={24} />,
                  title: t('VTHO Rewarded'),
                  children: <Text>{'123.456'} VTHO</Text>,
                },
              ] satisfies DataCardGroupItem[]
            }
          />
        </Grid>
      </Flex>
    </Card>
  )
}
