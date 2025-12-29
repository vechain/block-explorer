'use client'

import { Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { BaseLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'

interface TokenRowProps {
  label: string
  value: string
  iconSrc?: string
  iconAlt?: string
  iconWidth?: number
  iconHeight?: number
  isFirst?: boolean
  isLast?: boolean
}

const TokenRow = ({ label, value, iconSrc, iconAlt, iconWidth, iconHeight, isFirst, isLast }: TokenRowProps) => {
  const borderProps = isFirst
    ? { borderWidth: '1px', borderTopRadius: 'md' as const }
    : isLast
      ? { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomRadius: 'md' as const }
      : { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px' }

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      pt={4}
      pr={6}
      pb={4}
      pl={6}
      borderColor="border-primary"
      {...borderProps}
    >
      <Text textStyle="bodyM" color="text-primary">
        {label}
      </Text>
      <Flex alignItems="center" gap={2}>
        <Text textStyle="bodyM" color="text-primary">
          {value}
        </Text>
        {iconSrc && <Image src={iconSrc} alt={iconAlt || ''} width={iconWidth || 8} height={iconHeight || 12} />}
      </Flex>
    </Flex>
  )
}

interface TokenSectionProps {
  title: string
  rows: Omit<TokenRowProps, 'isFirst' | 'isLast'>[]
}

const TokenSection = ({ title, rows }: TokenSectionProps) => {
  return (
    <Stack gap={0}>
      <Heading as="h3" textStyle="bodyL" mb={4} color="text-primary">
        {title}
      </Heading>
      <Stack gap={0}>
        {rows.map((row, index) => (
          <TokenRow key={row.label} {...row} isFirst={index === 0} isLast={index === rows.length - 1} />
        ))}
      </Stack>
    </Stack>
  )
}

export const AccountSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()

  // Hardcoded data - will be replaced with hooks later
  const accountData = {
    firstSeen: {
      date: '28/08/2024',
      blockNumber: 19430520,
    },
    lastSeen: {
      date: '15/10/2025',
      blockNumber: 23022228,
    },
    totalTransactions: 34,
    totalClauses: 52,
    tokenBalance: {
      vtho: '290397.15',
      vetValue: '20434',
      btcValue: '0.00321766',
    },
    tokenValue: {
      vthoUsd: '$346',
      totalUsd: '$346',
      totalEur: '€298',
    },
  }

  const tokenBalanceRows = [
    {
      label: t('VeThor'),
      value: accountData.tokenBalance.vtho,
      iconSrc: '/icons/vtho.svg',
      iconAlt: 'VTHO',
      iconWidth: 8,
      iconHeight: 12,
    },
    {
      label: t('VET Value'),
      value: accountData.tokenBalance.vetValue,
      iconSrc: '/icons/vet.svg',
      iconAlt: 'VET',
      iconWidth: 11,
      iconHeight: 12,
    },
    {
      label: t('BTC Value'),
      value: accountData.tokenBalance.btcValue,
      iconSrc: '/icons/btc.svg',
      iconAlt: 'BTC',
      iconWidth: 9,
      iconHeight: 14,
    },
  ]

  const tokenValueRows = [
    {
      label: t('VeThor'),
      value: accountData.tokenValue.vthoUsd,
    },
    {
      label: t('Total USD'),
      value: accountData.tokenValue.totalUsd,
    },
    {
      label: t('Total EUR'),
      value: accountData.tokenValue.totalEur,
    },
  ]

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Account')}
          </Heading>
          <IDChip value={address} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          <DataCard
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('First Seen')}
            tooltip={t('Information coming soon')}
          >
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              <Text textStyle="bodyL" color="text-primary">
                {accountData.firstSeen.date}
              </Text>
              <BaseLink href={`/block/${accountData.firstSeen.blockNumber}`}>
                <Text textStyle="bodyL" color="text-alt-secondary">
                  #{accountData.firstSeen.blockNumber.toLocaleString()}
                </Text>
              </BaseLink>
            </Flex>
          </DataCard>

          <DataCard
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('Last Seen')}
            tooltip={t('Information coming soon')}
          >
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              <Text textStyle="bodyL" color="text-primary">
                {accountData.lastSeen.date}
              </Text>
              <BaseLink href={`/block/${accountData.lastSeen.blockNumber}`}>
                <Text textStyle="bodyL" color="text-alt-secondary">
                  #{accountData.lastSeen.blockNumber.toLocaleString()}
                </Text>
              </BaseLink>
            </Flex>
          </DataCard>

          <DataCard
            icon={<Image src="/icons/transaction.svg" alt="Transactions" />}
            title={t('Total Transactions')}
            tooltip={t('Information coming soon')}
            pb={0}
          >
            <Text textStyle="bodyL" color="text-primary" mb={0}>
              {accountData.totalTransactions.toLocaleString()}
            </Text>
          </DataCard>

          <DataCard
            icon={<Image src="/icons/clause.svg" alt="Clauses" />}
            title={t('Total Clauses')}
            tooltip={t('Information coming soon')}
            pb={0}
          >
            <Text textStyle="bodyL" color="text-primary" mb={0}>
              {accountData.totalClauses.toLocaleString()}
            </Text>
          </DataCard>
        </Flex>

        <Card variant="secondary" borderRadius="md" mt={4}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 5, md: 5 }}>
            <TokenSection title={t('Token Balance')} rows={tokenBalanceRows} />
            <TokenSection title={t('Token Value')} rows={tokenValueRows} />
          </Grid>
        </Card>
      </Card>
    </Stack>
  )
}
