'use client'

import { Flex, Heading, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { AddressLink, BaseLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import type { BlockId } from '@/lib/schemas'
import { useBlockExpanded } from '@/services/thor/hooks'
import { useFormatNumber } from '@/hooks/useFormatting'
import { TransactionsTable } from '../../../components/TransactionsTable'
import { BlockInsight } from '../../components/BlockInsights'

export const BlockDetails = ({ blockId }: { blockId: BlockId }) => {
  const { data: block, isPending } = useBlockExpanded(blockId)
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  if (isPending) return <div>Loading...</div>

  if (!block) {
    notFound()
  }

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Block Details')}
          </Heading>
          <IDChip value={block.id} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          {/* Date and time */}
          <DataCard
            variant="secondary"
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('Block Number')}
            tooltip={t('Information coming soon')}
          >
            <Text textStyle="bodyL" color="text-primary">
              #{formatNumber(block.number)}
            </Text>
          </DataCard>

          {/* Clauses count */}
          <DataCard
            variant="secondary"
            icon={<Image src="/icons/clause.svg" alt="Clauses" />}
            title={t('Total Clauses')}
            tooltip={t('Information coming soon')}
          >
            <Text>{block.transactions.reduce((acc, tx) => acc + tx.clauses.length, 0)}</Text>
          </DataCard>

          {/* Block signer */}
          <DataCard
            variant="secondary"
            icon={<Image src="/icons/link.svg" alt="Signer" />}
            title={t('Block Signer')}
            tooltip={t('Information coming soon')}
          >
            <AddressLink address={block.signer} truncate />
          </DataCard>

          {/* Parent block */}
          <DataCard
            variant="secondary"
            icon={<Image src="/icons/link.svg" alt="Parent block" />}
            title={t('Parent block')}
            tooltip={t('Information coming soon')}
          >
            <BaseLink href={`/block/${block.parentID}`}>#{formatNumber(block.number - 1)}</BaseLink>
          </DataCard>
        </Flex>

        <BlockInsight block={block} />
      </Card>

      <Card>
        <Heading as="h2" textStyle="displayXs">
          {t('Transactions')}
        </Heading>
        <TransactionsTable transactions={block.transactions} />
      </Card>
    </Stack>
  )
}
