'use client'

import { Heading, Text, VStack } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatGwei } from 'viem'
import { VTHOBalanceWithFiat } from '@/components/ui/Balance'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { GasUsed } from '@/components/ui/GasFees'
import { CopyableLink } from '@/components/ui/Links'
import { TxFeaturesBadge } from '@/components/ui/TxTypeBadge'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { ExpandedBlock } from '@/lib/schemas'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const vthoMetrics = useMemo(() => {
    const totalPaid = block.transactions.reduce((sum, tx) => sum + (tx.paid ?? 0n), 0n)
    const totalRewarded = block.transactions.reduce((sum, tx) => sum + (tx.reward ?? 0n), 0n)

    return {
      totalPaid,
      totalRewarded,
      totalBurned: totalPaid - totalRewarded,
    }
  }, [block.transactions])

  const blockInsights: DataCardGroupItem[] = [
    {
      title: t('Type'),
      children: <TxFeaturesBadge features={block.txsFeatures} />,
    },
    {
      title: t('Parent block'),
      children: (
        <CopyableLink href={`/block/${block.parentID}`} value={String(block.number - 1)}>
          #{formatNumber(block.number - 1)}
        </CopyableLink>
      ),
    },
    {
      title: t('Block Finality'),
      children: <Text>{block.isFinalized ? t('Finalized') : t('Finalizing')}</Text>,
    },
  ]

  const feeAndGasItems: DataCardGroupItem[] = [
    {
      title: t('Transaction fees'),
      children: <VTHOBalanceWithFiat balance={vthoMetrics.totalPaid} />,
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
      title: t('VTHO Burned'),
      children: <VTHOBalanceWithFiat balance={vthoMetrics.totalBurned} />,
    },
    {
      title: t('VTHO Rewarded'),
      children: <VTHOBalanceWithFiat balance={vthoMetrics.totalRewarded} />,
    },
  ] satisfies DataCardGroupItem[]

  return (
    <VStack alignItems="stretch" gap={4}>
      <DataCardGroup items={blockInsights} singleCard variant="outline" />

      <VStack alignItems="stretch" gap="3">
        <Heading as="h3" textStyle="bodyL" color="text-primary">
          {t('Fees, Gas and VTHO')}
        </Heading>
        <DataCardGroup items={feeAndGasItems} singleCard variant="outline" />
      </VStack>
    </VStack>
  )
}
