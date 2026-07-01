'use client'

import { Badge, Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { CopyableAddressLink } from '@/components/ui/Links'
import { useFormatDate } from '@/hooks/useFormatting'
import type { AgentRegistration } from '@/services/agent-nft/schemas'
import type { AgentInfo } from '@/services/thor/tokens/agent-registry'
import { DetailRow, SectionCard } from '../AgentDetail'

interface OverviewTabProps {
  registration: AgentRegistration
  agentInfo: AgentInfo | null | undefined
  isAgentInfoPending: boolean
}

export const OverviewTab = ({ registration, agentInfo, isAgentInfoPending }: OverviewTabProps) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()

  const agentId = registration.registrations[0]?.agentId

  return (
    <SectionCard title={t('Agent Overview')}>
      <DetailRow label={t('Name')}>
        <Text textStyle="bodyM" color="text-primary">
          {registration.name || '-'}
        </Text>
      </DetailRow>
      {registration.description && (
        <DetailRow label={t('Description')}>
          <Text textStyle="bodyM" color="text-primary" whiteSpace="pre-wrap">
            {registration.description}
          </Text>
        </DetailRow>
      )}
      <DetailRow label={t('Agent ID')}>
        <Text textStyle="bodyM" color="text-primary">
          #{agentId ?? '-'}
        </Text>
      </DetailRow>
      <DetailRow label={t('Creator')}>
        {isAgentInfoPending ? (
          <Skeleton height="16px" width="100px" />
        ) : agentInfo?.creator ? (
          <CopyableAddressLink address={agentInfo.creator} truncate />
        ) : (
          <Text textStyle="bodyM" color="text-secondary">
            -
          </Text>
        )}
      </DetailRow>
      {agentInfo?.registeredAt ? (
        <DetailRow label={t('Registered')}>
          <Text textStyle="bodyM" color="text-primary">
            {formatDate(agentInfo.registeredAt)}
          </Text>
        </DetailRow>
      ) : null}
      <DetailRow label={t('Status')}>
        {agentInfo?.deactivated ? (
          <Badge colorPalette="red">{t('Deactivated')}</Badge>
        ) : agentInfo?.suspended ? (
          <Badge colorPalette="orange">{t('Suspended')}</Badge>
        ) : registration.active === false ? (
          <Badge colorPalette="gray">{t('Inactive')}</Badge>
        ) : (
          <Badge colorPalette="green">{t('Active')}</Badge>
        )}
      </DetailRow>
      {registration.supportedTrust.length > 0 && (
        <DetailRow label={t('Supported Trust')}>
          <Text textStyle="bodyM" color="text-primary">
            {registration.supportedTrust.join(', ')}
          </Text>
        </DetailRow>
      )}
    </SectionCard>
  )
}
