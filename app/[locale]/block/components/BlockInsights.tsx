'use client'

import { Flex, Heading, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { GasUsed } from '@/components/ui/GasFees'
import { Card } from '@/components/ui/Card'
import type { ExpandedBlock } from '@/lib/schemas'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { TxFeaturesBadge } from '@/components/ui/TxTypeBadge'
import { formatGwei } from 'viem'
import { useIsMobile } from '@/hooks/useIsMobile'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const isMobile = useIsMobile()

  const blockInsights: DataCardGroupItem[] = [
    {
      title: t('Type'),
      children: <TxFeaturesBadge features={block.txsFeatures} />,
    },
    {
      title: t('Block Finality'),
      children: <Text>{block.isFinalized ? t('Finalized') : t('Finalizing')}</Text>,
    },
    {
      title: t('Gas Used'),
      children: <GasUsed gasUsed={block.gasUsed} gasLimit={block.gasLimit} />,
    },
    {
      title: t('Gas Limit'),
      children: <Text>{formatNumber(Number(block.gasLimit))}</Text>,
    },
    {
      title: t('Base Fee per Gas'),
      children: (
        <Text>{block.baseFeePerGas ? `${formatNumber(Number(formatGwei(block.baseFeePerGas)))} Gwei` : '-'}</Text>
      ),
    },
    {
      title: t('Transactions'),
      children: <Text>{formatNumber(block.transactions.length)}</Text>,
    },
    ...(isMobile
      ? [
          {
            title: t('VTHO Paid'),
            children: <Text>{'123.456'} VTHO</Text>,
          },
          {
            title: t('VTHO Burned'),
            children: <Text>{'123.456'} VTHO</Text>,
          },
          {
            title: t('VTHO Rewarded'),
            children: <Text>{'123.456'} VTHO</Text>,
          },
        ]
      : ([] satisfies DataCardGroupItem[])),
  ] satisfies DataCardGroupItem[]

  return (
    <Card variant="secondary">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" gapX="2" gapY="4">
        <Heading as="h2" textStyle="displayXs">
          {t('Block Insights')}
        </Heading>

        <Text color="text-secondary">{formatDate(block.timestamp)}</Text>
      </Flex>

      <Flex alignItems="stretch" flexDirection={{ base: 'column', md: 'row' }} gap="4">
        <DataCardGroup items={blockInsights} singleCard variant="outline" />

        <DataCardGroup
          variant="outline"
          hidden={isMobile}
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
      </Flex>
    </Card>
  )
}
