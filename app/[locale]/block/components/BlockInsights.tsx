'use client'

import { Badge, Flex, Grid, Heading, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { DataCard } from '@/components/ui/DataCard'
import { GasUsed } from '@/components/ui/GasFees'
import { CopyableLink } from '@/components/ui/Links'
import { Surface } from '@/components/ui/Surface'
import type { ExpandedBlock } from '@/lib/schemas'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const { t } = useTranslation()

  const blockInsights = [
    {
      label: t('Block'),
      value: (
        <CopyableLink href={`/block/${block.id}`} value={block.number.toString()}>
          {`#${block.number.toString()}`}
        </CopyableLink>
      ),
    },
    {
      label: t('Age'),
      value: <AgeText timestamp={block.timestamp} />,
    },
    {
      label: t('Features'),
      value: <TxFeatures features={block.txsFeatures} />,
    },
    {
      label: t('Gas Used'),
      value: <GasUsed gasUsed={block.gasUsed} gasLimit={block.gasLimit} />,
    },
    {
      label: t('Block Finality'),
      value: block.isFinalized ? t('Finalized') : t('Finalizing'),
    },
    {
      label: t('Transactions'),
      value: block.transactions.length.toLocaleString(),
    },
  ]

  return (
    <Surface variant="secondary">
      <Heading as="h2" textStyle="displayXs">
        {t('Block Insights')}
      </Heading>
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
          {blockInsights.map(insight => (
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
          <DataCard
            icon={<Image src="/icons/coin.svg" alt="VTHO Paid" />}
            title={t('VTHO Paid')}
            tooltip={t('Information coming soon')}
          >
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard
            icon={<Image src="/icons/flash.svg" alt="VTHO Burned" />}
            title={t('VTHO Burned')}
            tooltip={t('Information coming soon')}
          >
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard
            icon={<Image src="/icons/reward.svg" alt="VTHO Rewarded" />}
            title={t('VTHO Rewarded')}
            tooltip={t('Information coming soon')}
          >
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard
            icon={<Image src="/icons/co2e.svg" alt="CO2 emitted" />}
            title={t('CO2e emitted')}
            tooltip={t('Information coming soon')}
          >
            <Text>
              {'123.456'} {t('g')}
            </Text>
          </DataCard>
        </Grid>
      </Flex>
    </Surface>
  )
}

const TxFeatures = ({ features }: { features: number | undefined }) => {
  const { t } = useTranslation()

  if (features === 1) {
    return (
      <Badge textStyle="bodyS" rounded="8px" variant="subtle" px="2" py="1" size="sm" bg="bg-secondary">
        {t('VIP-191 - Fee delegation')}
      </Badge>
    )
  }

  return null
}
