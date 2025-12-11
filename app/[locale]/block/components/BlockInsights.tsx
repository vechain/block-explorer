import { Badge, Flex, Grid, Heading, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { AgeText } from '@/components/ui/AgeText'
import { DataCard } from '@/components/ui/DataCard'
import { GasUsed } from '@/components/ui/GasFees'
import { CopyableLink } from '@/components/ui/Links'
import { Surface } from '@/components/ui/Surface'
import type { ExpandedBlock } from '@/lib/schemas'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const blockInsights = [
    {
      label: 'Block',
      value: (
        <CopyableLink href={`/block/${block.id}`} value={block.number.toString()}>
          {`#${block.number.toString()}`}
        </CopyableLink>
      ),
    },
    {
      label: 'Age',
      value: <AgeText timestamp={block.timestamp} />,
    },
    {
      label: 'Features',
      value: <TxFeatures features={block.txsFeatures} />,
    },
    {
      label: 'Gas Used',
      value: <GasUsed gasUsed={block.gasUsed} gasLimit={block.gasLimit} />,
    },
    {
      label: 'Block Finality',
      value: block.isFinalized ? 'Finalized' : 'Finalizing',
    },
    {
      label: 'Transactions',
      value: block.transactions.length.toLocaleString(),
    },
  ]

  return (
    <Surface bg="bg-surface-alt" borderColor="transparent">
      <Heading as="h2" textStyle="displayXs">
        Block Insights
      </Heading>
      <Flex alignItems="center" flexDirection={{ base: 'column', md: 'row' }} gap="4">
        <Flex
          flex="1"
          flexDirection="column"
          alignSelf="stretch"
          rounded="md"
          border="1px solid"
          textStyle="bodyM"
          borderColor="border-surface">
          {blockInsights.map(insight => (
            <Flex
              key={insight.label}
              py="4"
              px="6"
              flex="1"
              alignItems="center"
              borderBottom="1px solid var(--chakra-colors-border-surface)"
              css={{ '&:last-child': { borderBottom: 'none' } }}>
              <Text width="130px">{insight.label}</Text>
              {insight.value}
            </Flex>
          ))}
        </Flex>
        <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} flex="1" alignSelf="stretch" gap="4">
          {/* //TODO: Add relevant data to data cards */}
          <DataCard
            icon={<Image src="/icons/coin.svg" alt="VTHO Paid" />}
            title="VTHO Paid"
            tooltip="Information coming soon">
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard
            icon={<Image src="/icons/flash.svg" alt="VTHO Burned" />}
            title="VTHO Burned"
            tooltip="Information coming soon">
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard
            icon={<Image src="/icons/reward.svg" alt="VTHO Rewarded" />}
            title="VTHO Rewarded"
            tooltip="Information coming soon">
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard
            icon={<Image src="/icons/co2e.svg" alt="CO2 emitted" />}
            title="CO2e emitted"
            tooltip="Information coming soon">
            <Text>{'123.456'} g</Text>
          </DataCard>
        </Grid>
      </Flex>
    </Surface>
  )
}

const TxFeatures = ({ features }: { features: number | undefined }) => {
  if (features === 1) {
    return (
      <Badge textStyle="bodyS" rounded="8px" variant="subtle" px="2" py="1" size="sm" bg="bg-surface-alt">
        VIP-191 - Fee delegation
      </Badge>
    )
  }

  return null
}
