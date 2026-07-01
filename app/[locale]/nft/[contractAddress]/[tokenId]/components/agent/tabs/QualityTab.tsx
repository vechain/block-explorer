'use client'

import { Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { AgentReputation } from '@/services/thor/tokens/reputation-registry'
import { AgentEmptyState, DetailRow, SectionCard } from '../AgentDetail'

interface QualityTabProps {
  reputation: AgentReputation | undefined
  isPending: boolean
  hasReputationRegistry: boolean
}

export const QualityTab = ({ reputation, isPending, hasReputationRegistry }: QualityTabProps) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  if (!hasReputationRegistry) {
    return (
      <AgentEmptyState
        title={t('No quality data available')}
        description={t('This agent does not publish an on-chain reputation registry')}
      />
    )
  }

  if (isPending) {
    return <Skeleton height="96px" borderRadius="md" />
  }

  if (!reputation || reputation.feedbackCount === 0) {
    return (
      <AgentEmptyState title={t('No feedback yet')} description={t('This agent has not received any feedback yet')} />
    )
  }

  return (
    <SectionCard title={t('Quality')}>
      <DetailRow label={t('Average Rating')}>
        <Text textStyle="bodyM" color="text-primary">
          {reputation.averageValue != null ? formatNumber(reputation.averageValue, { maximumFractionDigits: 2 }) : '-'}
        </Text>
      </DetailRow>
      <DetailRow label={t('Total Feedback')}>
        <Text textStyle="bodyM" color="text-primary">
          {formatNumber(reputation.feedbackCount)}
        </Text>
      </DetailRow>
      <DetailRow label={t('Unique Clients')}>
        <Text textStyle="bodyM" color="text-primary">
          {formatNumber(reputation.clientCount)}
        </Text>
      </DetailRow>
    </SectionCard>
  )
}
