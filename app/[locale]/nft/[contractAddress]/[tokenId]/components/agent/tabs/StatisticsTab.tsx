'use client'

import { Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuMessageSquare, LuUsers } from 'react-icons/lu'
import { DataCardGroup } from '@/components/ui/DataCardGroup'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { AgentReputation } from '@/services/thor/tokens/reputation-registry'
import { AgentEmptyState } from '../AgentDetail'

interface StatisticsTabProps {
  reputation: AgentReputation | undefined
  isPending: boolean
  hasReputationRegistry: boolean
}

export const StatisticsTab = ({ reputation, isPending, hasReputationRegistry }: StatisticsTabProps) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  if (!hasReputationRegistry) {
    return (
      <AgentEmptyState
        title={t('No statistics available')}
        description={t('This agent does not publish an on-chain reputation registry')}
      />
    )
  }

  if (isPending) {
    return <Skeleton height="96px" borderRadius="md" />
  }

  return (
    <DataCardGroup
      items={[
        {
          icon: <LuMessageSquare />,
          title: t('Total Feedback'),
          children: (
            <Text textStyle="displayXs" color="text-primary">
              {formatNumber(reputation?.feedbackCount ?? 0)}
            </Text>
          ),
        },
        {
          icon: <LuUsers />,
          title: t('Unique Clients'),
          children: (
            <Text textStyle="displayXs" color="text-primary">
              {formatNumber(reputation?.clientCount ?? 0)}
            </Text>
          ),
        },
      ]}
    />
  )
}
