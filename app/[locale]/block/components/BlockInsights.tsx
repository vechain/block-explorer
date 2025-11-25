import { AbsoluteCenter, Badge, Flex, Grid, Heading, ProgressCircle, Text } from '@chakra-ui/react'
import { LuLink } from 'react-icons/lu'
import { AgeText } from '@/components/ui/AgeText'
import { DataCard } from '@/components/ui/DataCard'
import { Surface } from '@/components/ui/Surface'
import type { ExpandedBlock } from '@/lib/schemas'

export const BlockInsight = ({ block }: { block: ExpandedBlock }) => {
  const blockInsights = [
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
          {/* TODO: Add icons to data cards */}
          {/* TODO: Add relevant data to data cards */}
          <DataCard icon={<LuLink />} title="VTHO Paid" tooltip="Information coming soon">
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard icon={<LuLink />} title="VTHO Burned" tooltip="Information coming soon">
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard icon={<LuLink />} title="VTHO Rewarded" tooltip="Information coming soon">
            <Text>{'123.456'} VTHO</Text>
          </DataCard>
          <DataCard icon={<LuLink />} title="CO2e emitted" tooltip="Information coming soon">
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

const GasUsed = ({ gasUsed, gasLimit }: { gasUsed: number; gasLimit: number }) => {
  const gasUsedRatio = (gasUsed / gasLimit) * 100

  return (
    <ProgressCircle.Root size="md" value={gasUsedRatio} color="teal">
      <ProgressCircle.Circle css={{ '--thickness': '3px' }}>
        <ProgressCircle.Track />
        <ProgressCircle.Range strokeLinecap="round" stroke="highlight-secondary" />
      </ProgressCircle.Circle>
      <AbsoluteCenter>
        <ProgressCircle.ValueText fontSize="xxs" color="text-primary" />
      </AbsoluteCenter>
    </ProgressCircle.Root>
  )
}
