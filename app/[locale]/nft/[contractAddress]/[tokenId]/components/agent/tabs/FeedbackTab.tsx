'use client'

import { Badge, Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow } from '@/components/ui/Table'
import type { AddressString } from '@/lib/schemas'
import type { AgentReputation } from '@/services/thor/tokens/reputation-registry'
import { AgentEmptyState } from '../AgentDetail'

interface FeedbackTabProps {
  reputation: AgentReputation | undefined
  isPending: boolean
  hasReputationRegistry: boolean
}

interface FeedbackRow extends TableRow {
  id: string
  client: string
  value: string
  status: string
}

export const FeedbackTab = ({ reputation, isPending, hasReputationRegistry }: FeedbackTabProps) => {
  const { t } = useTranslation()

  if (!hasReputationRegistry) {
    return (
      <AgentEmptyState
        title={t('No feedback available')}
        description={t('This agent does not publish an on-chain reputation registry')}
      />
    )
  }

  if (isPending) {
    return <Skeleton height="120px" borderRadius="md" />
  }

  if (!reputation || reputation.feedback.length === 0) {
    return (
      <AgentEmptyState title={t('No feedback yet')} description={t('This agent has not received any feedback yet')} />
    )
  }

  const columns: Column<FeedbackRow>[] = [
    {
      key: 'client',
      label: t('Client'),
      Cell: ({ value }) => <CopyableAddressLink truncate address={value as AddressString} />,
    },
    {
      key: 'value',
      label: t('Rating'),
      Cell: ({ value }) => (
        <Text textStyle="bodyM" color="text-primary">
          {String(value)}
        </Text>
      ),
    },
    {
      key: 'status',
      label: t('Status'),
      Cell: ({ value }) => (
        <Badge colorPalette={value === 'revoked' ? 'red' : 'green'}>
          {value === 'revoked' ? t('Revoked') : t('Active')}
        </Badge>
      ),
    },
  ]

  const rows: FeedbackRow[] = reputation.feedback.map(entry => ({
    id: `${entry.client}-${entry.index}`,
    client: entry.client,
    value: String(entry.value),
    status: entry.revoked ? 'revoked' : 'active',
  }))

  return <DataTable columns={columns} rows={rows} />
}
