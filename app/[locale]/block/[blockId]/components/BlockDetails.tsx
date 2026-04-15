'use client'

import { Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { IDChip } from '@/components/ui/IDChip'
import { CopyableString } from '@/components/ui/CopyableString'
import { CopyableAddressLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useRedirectOnNotFound } from '@/hooks/useRedirectOnNotFound'
import type { BlockRevision } from '@/lib/schemas'
import { useBlockExpanded } from '@/services/thor/block'
import { TransactionsTable } from '../../../components/TransactionsTable'
import { BlockInsight } from '../../components/BlockInsights'

export const BlockDetails = ({ blockId }: { blockId: BlockRevision }) => {
  const { data: block, isPending } = useBlockExpanded(blockId)
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatNumber = useFormatNumber()

  const isNotFound = useRedirectOnNotFound({ isNotFound: !isPending && !block })

  if (isPending || isNotFound || !block) return <Skeleton height="400px" width="100%" />

  const totalClauses = block.transactions.reduce((acc, tx) => acc + tx.clauses.length, 0)

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Block Details')}
          </Heading>
          <IDChip value={block.id} />
        </Flex>

        <DataCardGroup
          variant="outline"
          desktopColumns={4}
          items={
            [
              {
                icon: <Image src="/icons/calendar.svg" alt="Calendar" />,
                title: t('Block Number'),
                children: (
                  <CopyableString value={String(block.number)} textStyle="bodyL">
                    #{formatNumber(block.number)}
                  </CopyableString>
                ),
              },
              {
                icon: <Image src="/icons/link.svg" alt="Signer" />,
                title: t('Block Signer'),
                children: <CopyableAddressLink address={block.signer} truncate />,
              },
              {
                icon: <Image src="/icons/clock.svg" alt="Timestamp" />,
                title: t('Timestamp'),
                children: <Text>{formatDate(block.timestamp)}</Text>,
              },
              {
                icon: <Image src="/icons/clause.svg" alt="Transactions and clauses" />,
                title: `${t('Transactions')} / ${t('Clauses')}`,
                children: <Text>{`${formatNumber(block.transactions.length)} / ${formatNumber(totalClauses)}`}</Text>,
              },
            ] as DataCardGroupItem[]
          }
        />

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
