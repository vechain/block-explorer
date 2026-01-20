'use client'

import { Flex, Heading, Text, VStack } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { GasUsed } from '@/components/ui/GasFees'
import type { ExpandedBlock } from '@/lib/schemas'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useMemo } from 'react'
import { TxFeaturesBadge } from '@/components/ui/TxTypeBadge'
import { formatGwei, formatUnits } from 'viem'
import { useIsMobile } from '@/hooks/useIsMobile'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const isMobile = useIsMobile()

  // Calculate VTHO metrics from transaction receipts
  const vthoMetrics = useMemo(() => {
    const totalPaid = block.transactions.reduce((sum, tx) => sum + (tx.paid ?? 0n), 0n)
    const totalRewarded = block.transactions.reduce((sum, tx) => sum + (tx.reward ?? 0n), 0n)
    const totalBurned = totalPaid - totalRewarded

    // Convert from wei (18 decimals) to VTHO
    const vthoPaid = parseFloat(formatUnits(totalPaid, 18))
    const vthoRewarded = parseFloat(formatUnits(totalRewarded, 18))
    const vthoBurned = parseFloat(formatUnits(totalBurned, 18))

    return { vthoPaid, vthoRewarded, vthoBurned }
  }, [block.transactions])

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
            children: <Text>{formatNumber(vthoMetrics.vthoPaid, { maximumFractionDigits: 6 })} VTHO</Text>,
          },
          {
            title: t('VTHO Burned'),
            children: <Text>{formatNumber(vthoMetrics.vthoBurned, { maximumFractionDigits: 6 })} VTHO</Text>,
          },
          {
            title: t('VTHO Rewarded'),
            children: <Text>{formatNumber(vthoMetrics.vthoRewarded, { maximumFractionDigits: 6 })} VTHO</Text>,
          },
        ]
      : ([] satisfies DataCardGroupItem[])),
  ] satisfies DataCardGroupItem[]

  return (
    <VStack alignItems="stretch" gap={4}>
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
                children: <Text>{formatNumber(vthoMetrics.vthoPaid, { maximumFractionDigits: 6 })} VTHO</Text>,
              },
              {
                icon: <Image src="/icons/flash.svg" alt="VTHO Burned" width={24} height={24} />,
                title: t('VTHO Burned'),
                children: <Text>{formatNumber(vthoMetrics.vthoBurned, { maximumFractionDigits: 6 })} VTHO</Text>,
              },
              {
                icon: <Image src="/icons/reward.svg" alt="VTHO Rewarded" width={24} height={24} />,
                title: t('VTHO Rewarded'),
                children: <Text>{formatNumber(vthoMetrics.vthoRewarded, { maximumFractionDigits: 6 })} VTHO</Text>,
              },
            ] satisfies DataCardGroupItem[]
          }
          desktopContainerProps={{ h: 'fit-content' }}
        />
      </Flex>
    </VStack>
  )
}
