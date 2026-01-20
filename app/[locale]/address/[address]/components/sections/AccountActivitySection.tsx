'use client'

import { useMemo } from 'react'
import { Box, Flex, Heading, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowDownLeft, LuArrowUpRight, LuFlame } from 'react-icons/lu'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { Balance, VETBalance, VTHOBalance } from '@/components/ui/Balance'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview, useAddressTransactions } from '@/services/veworld-indexer/hooks'
import { useFormatNumber } from '@/hooks/useFormatting'

const mainColor = '#E782FF'

interface ChartDataPoint {
  month: string
  count: number
  timestamp: number
}

export const AccountActivitySection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const { data: overview } = useAccountOverview(address)
  const { data: transactions } = useAddressTransactions({
    address,
    hasCode: false,
    page: 0,
    size: 100,
  })

  const chartData = useMemo(() => {
    if (!transactions?.data) return []

    const monthCounts = new Map<string, { count: number; timestamp: number }>()

    for (const tx of transactions.data) {
      const date = new Date(tx.blockTimestamp * 1000)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const existing = monthCounts.get(monthKey)
      if (existing) {
        existing.count++
      } else {
        monthCounts.set(monthKey, { count: 1, timestamp: tx.blockTimestamp })
      }
    }

    const sorted = Array.from(monthCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [year, month] = key.split('-')
        const date = new Date(Number(year), Number(month) - 1)
        return {
          month: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          count: value.count,
          timestamp: value.timestamp,
        }
      })

    return sorted
  }, [transactions?.data])

  const items: DataCardGroupItem[] = [
    {
      icon: <LuArrowDownLeft />,
      title: t('Total VET Received'),
      children: <VETBalance balance={BigInt(overview?.vetReceived ?? '0')} />,
    },
    {
      icon: <LuArrowUpRight />,
      title: t('Total VET Sent'),
      children: <VETBalance balance={BigInt(overview?.vetSent ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('Gas Used'),
      children: <Balance balance={BigInt(overview?.gasUsed ?? '0')} symbol="VTHO" decimals={5} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Burned'),
      children: <VTHOBalance balance={BigInt(overview?.vthoBurned ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Delegated'),
      children: <VTHOBalance balance={BigInt(overview?.vthoDelegated ?? '0')} />,
    },
  ]

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Activity')}
      </Heading>
      <Stack gap="4">
        <DataCardGroup items={items} desktopColumns={5} />
        {chartData.length > 0 && (
          <Card variant="secondary">
            <AccountActivityChart data={chartData} />
          </Card>
        )}
      </Stack>
    </Card>
  )
}

const AccountActivityChart = ({ data }: { data: ChartDataPoint[] }) => {
  const formatNumber = useFormatNumber()
  const chartHeight = useBreakpointValue({ base: '200px', md: '250px' })

  return (
    <Box h={chartHeight}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="txCountGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={mainColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tick={{ style: { fontSize: '.7rem' } }}
            axisLine={false}
            stroke="white"
          />
          <YAxis
            dataKey="count"
            tickFormatter={(value: number) => formatNumber(value)}
            tick={{ style: { fontSize: '.8rem' } }}
            axisLine={false}
            stroke="white"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="count" stroke={mainColor} strokeWidth={2} fill="url(#txCountGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  if (!active || !payload?.length) return null

  const dataPoint = payload[0].payload

  return (
    <Stack bg="tooltip-bg" border="1px solid" borderColor="border-primary" rounded="xl" p={4}>
      <Text fontSize="sm" fontWeight="bold">
        {dataPoint.month}
      </Text>
      <Flex alignItems="center" gap={2}>
        <Text fontSize="sm" fontWeight="bold">
          {t('Transactions')}:
        </Text>
        <Text fontSize="sm">{formatNumber(dataPoint.count)}</Text>
      </Flex>
    </Stack>
  )
}
