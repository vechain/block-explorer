'use client'

import { VStack } from '@chakra-ui/react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountTotalsChart } from '../components/AccountTotalsChart/AccountTotalsChart'
import { useFormatNumber } from '@/hooks/useFormatting'
import { AFPTChart } from '../components/AFPTChart/AFPTChart'
import { AFPUChart } from '../components/AFPUChart/AFPUChart'
import { BlockChart } from '../components/BlockChart/BlockChart'

export default function StatsPage() {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const formatGasYAxis = useCallback((value: number) => formatNumber(Number(value) / 10 ** 6), [formatNumber])
  const formatTxYAxis = useCallback((value: number) => formatNumber(Math.round(value)), [formatNumber])

  return (
    <VStack gap={8} alignItems="stretch">
      <AFPTChart />
      <AFPUChart />
      <AccountTotalsChart />
      <BlockChart dataKey="usagePercentage" title={t('Block Usage')} color="#E782FF" chartType="line" yAxisUnit="%" />
      <BlockChart
        dataKey="gasUsed"
        title={t('Gas Used')}
        color="#E782FF"
        yAxisUnit="M"
        yAxisFormatter={formatGasYAxis}
      />
      <BlockChart
        dataKey="numTransactions"
        title={t('Total Transactions')}
        color="#82B1FF"
        yAxisFormatter={formatTxYAxis}
      />
    </VStack>
  )
}
