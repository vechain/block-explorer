'use client'

import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/Card'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { useFormatCurrency, useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { MarketCapRange, useMarketCapData, type MarketCapToken } from '@/hooks/useMarketCapData'

const chartHeight = 80

type DataPoint = {
  timestamp: number
  marketCap: number
}

const TOKEN_OPTIONS: ToggleOption<MarketCapToken>[] = [
  { value: 'vechain', label: 'VET' },
  { value: 'vethor-token', label: 'VTHO' },
  { value: 'vebetterdao', label: 'B3TR' },
]

export const MarketCapChart = () => {
  const { t } = useTranslation()
  const formatCurrency = useFormatCurrency()
  const formatNumber = useFormatNumber()
  const [selectedToken, setSelectedToken] = useState<MarketCapToken>('vechain')
  const [selectedRange, setSelectedRange] = useState<MarketCapRange>(MarketCapRange.DAY)

  const { data, circulatingSupply, currentMarketCap } = useMarketCapData(selectedToken, selectedRange)

  const chartData: DataPoint[] = useMemo(() => data ?? [], [data])

  const rangeOptions: ToggleOption<MarketCapRange>[] = [
    { value: MarketCapRange.DAY, label: t('1D') },
    { value: MarketCapRange.MONTH, label: t('1M') },
    { value: MarketCapRange.YEAR, label: t('1Y') },
  ]

  return (
    <Card width="415px" height="274px" gap={3}>
      <Flex justify="space-between" align="center">
        <Heading as="h3" textStyle="bodyL">
          {t('Market Cap')}
        </Heading>

        <ToggleGroup
          options={rangeOptions}
          value={selectedRange}
          onChange={setSelectedRange}
          layoutId="market-cap-range"
          size="sm"
        />
      </Flex>

      <Text textStyle="displayS" color="success-text" mt={-2}>
        {formatCurrency(currentMarketCap ?? 0, { maximumFractionDigits: 0 })}
      </Text>

      <MarketCapChartVisualization data={chartData} />

      <Flex justify="space-between" align="flex-end" mt="auto">
        <Stack gap={0}>
          <Text textStyle="bodyS" color="text-secondary">
            {t('Circulating Supply')}
          </Text>
          <Text textStyle="bodyM">{formatNumber(circulatingSupply, { maximumFractionDigits: 0 })}</Text>
        </Stack>

        <ToggleGroup
          options={TOKEN_OPTIONS}
          value={selectedToken}
          onChange={setSelectedToken}
          layoutId="market-cap-token"
          size="sm"
        />
      </Flex>
    </Card>
  )
}

const MarketCapChartVisualization = memo(({ data }: { data: DataPoint[] }) => {
  const { t } = useTranslation()
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()

  const values = data.map(d => d.marketCap)
  const minValue = values.length > 0 ? Math.min(...values) : 0
  const maxValue = values.length > 0 ? Math.max(...values) : 0
  const range = maxValue - minValue

  const padding = range > 0 ? range * 0.05 : maxValue * 0.01
  const domainMin = Math.max(0, minValue - padding)
  const domainMax = maxValue + padding

  const renderTooltip = useCallback(
    ({ active, payload }: TooltipContentProps<number, string>) => {
      if (!active || !payload || payload.length === 0) return null

      const dataPoint = payload[0].payload as DataPoint

      return (
        <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
          <Flex alignItems="center" gap={2}>
            <Text textStyle="bodyMSemibold">{t('Date & Time')}:</Text>
            <Text textStyle="bodyM">{formatDate(dataPoint.timestamp)}</Text>
          </Flex>

          <Flex alignItems="center" gap={2}>
            <Text textStyle="bodyMSemibold">{t('Market Cap')}:</Text>
            <Text textStyle="bodyM">{formatCurrency(dataPoint.marketCap, { maximumFractionDigits: 0 })}</Text>
          </Flex>
        </Stack>
      )
    },
    [t, formatCurrency, formatDate],
  )

  return (
    <Box height={chartHeight} flex={1}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          height={chartHeight}
          data={data}
          margin={{
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <XAxis dataKey="timestamp" hide={true} />
          <YAxis dataKey="marketCap" domain={[domainMin, domainMax]} hide={true} />

          <Tooltip contentStyle={{ fontSize: '.8rem' }} content={renderTooltip} />
          <Area
            type="monotone"
            dataKey="marketCap"
            stroke="var(--chakra-colors-success-text)"
            strokeWidth={2}
            fill="none"
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
})

MarketCapChartVisualization.displayName = 'MarketCapChartVisualization'
