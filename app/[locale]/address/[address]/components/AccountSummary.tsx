'use client'

import { Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { BaseLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'

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
          {/* First Seen */}
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

          {/* Last Seen */}
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

          {/* Total Transactions */}
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

          {/* Total Clauses */}
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

        {/* Token Balance and Token Value sections */}
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: '4', md: '5' }} mt={4}>
          {/* Token Balance */}
          <Card variant="secondary" borderRadius="md" gap={4}>
            <Heading as="h3" textStyle="bodyL" mb={0} color="text-primary">
              {t('Token Balance')}
            </Heading>
            <Stack gap={0}>
              <Flex alignItems="center" justifyContent="space-between" py={3}>
                <Text textStyle="bodyM" color="text-primary">
                  {t('VeThor')}
                </Text>
                <Flex alignItems="center" gap={2}>
                  <Text textStyle="bodyM" color="text-primary">
                    {accountData.tokenBalance.vtho}
                  </Text>
                  <Image src="/icons/vtho.svg" alt="VTHO" width={8} height={12} />
                </Flex>
              </Flex>
              <Flex
                alignItems="center"
                justifyContent="space-between"
                py={3}
                borderTopWidth="1px"
                borderTopColor="border-primary"
              >
                <Text textStyle="bodyM" color="text-primary">
                  {t('VET Value')}
                </Text>
                <Flex alignItems="center" gap={2}>
                  <Text textStyle="bodyM" color="text-primary">
                    {accountData.tokenBalance.vetValue}
                  </Text>
                  <Image src="/icons/vet.svg" alt="VET" width={11} height={12} />
                </Flex>
              </Flex>
              <Flex
                alignItems="center"
                justifyContent="space-between"
                py={3}
                borderTopWidth="1px"
                borderTopColor="border-primary"
              >
                <Text textStyle="bodyM" color="text-primary">
                  {t('BTC Value')}
                </Text>
                <Flex alignItems="center" gap={2}>
                  <Text textStyle="bodyM" color="text-primary">
                    {accountData.tokenBalance.btcValue}
                  </Text>
                  <Image src="/icons/btc.svg" alt="BTC" width={9} height={14} />
                </Flex>
              </Flex>
            </Stack>
          </Card>

          {/* Token Value */}
          <Card variant="secondary" borderRadius="md" gap={4}>
            <Heading as="h3" textStyle="bodyL" mb={0} color="text-primary">
              {t('Token Value')}
            </Heading>
            <Stack gap={0}>
              <Flex alignItems="center" justifyContent="space-between" py={3}>
                <Text textStyle="bodyM" color="text-primary">
                  {t('VeThor')}
                </Text>
                <Text textStyle="bodyM" color="text-primary">
                  {accountData.tokenValue.vthoUsd}
                </Text>
              </Flex>
              <Flex
                alignItems="center"
                justifyContent="space-between"
                py={3}
                borderTopWidth="1px"
                borderTopColor="border-primary"
              >
                <Text textStyle="bodyM" color="text-primary">
                  {t('Total USD')}
                </Text>
                <Text textStyle="bodyM" color="text-primary">
                  {accountData.tokenValue.totalUsd}
                </Text>
              </Flex>
              <Flex
                alignItems="center"
                justifyContent="space-between"
                py={3}
                borderTopWidth="1px"
                borderTopColor="border-primary"
              >
                <Text textStyle="bodyM" color="text-primary">
                  {t('Total EUR')}
                </Text>
                <Text textStyle="bodyM" color="text-primary">
                  {accountData.tokenValue.totalEur}
                </Text>
              </Flex>
            </Stack>
          </Card>
        </Grid>
      </Card>
    </Stack>
  )
}
