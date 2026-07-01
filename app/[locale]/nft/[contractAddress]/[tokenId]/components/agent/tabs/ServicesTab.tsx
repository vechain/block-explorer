'use client'

import { Badge, Box, Link, Skeleton, Stack, Text, Wrap } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuExternalLink } from 'react-icons/lu'
import type { AgentCard, AgentRegistration } from '@/services/agent-nft/schemas'
import { AgentEmptyState, DetailRow, SectionCard } from '../AgentDetail'

interface ServicesTabProps {
  registration: AgentRegistration
  agentCard: AgentCard | null | undefined
  isAgentCardPending: boolean
}

const EndpointLink = ({ href }: { href: string }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    display="inline-flex"
    alignItems="center"
    gap={1}
    color="text-link"
  >
    <Box as="span" truncate maxWidth={{ base: '160px', md: '320px' }}>
      {href}
    </Box>
    <LuExternalLink size={12} />
  </Link>
)

export const ServicesTab = ({ registration, agentCard, isAgentCardPending }: ServicesTabProps) => {
  const { t } = useTranslation()
  const { services } = registration
  const hasServices = services.length > 0

  if (!hasServices && !isAgentCardPending && !agentCard) {
    return (
      <AgentEmptyState
        title={t('No services listed')}
        description={t('This agent has not advertised any services yet')}
      />
    )
  }

  return (
    <Stack gap={6}>
      {hasServices && (
        <SectionCard title={t('Services')}>
          {services.map((service, index) => (
            <DetailRow key={`${service.name}-${index}`} label={service.name || t('Endpoint')}>
              <Stack gap={1} align="flex-end">
                {service.endpoint ? (
                  <EndpointLink href={service.endpoint} />
                ) : (
                  <Text textStyle="bodyM" color="text-secondary">
                    -
                  </Text>
                )}
                {service.version && (
                  <Text textStyle="bodyS" color="text-secondary">
                    {`v${service.version}`}
                  </Text>
                )}
              </Stack>
            </DetailRow>
          ))}
        </SectionCard>
      )}

      {isAgentCardPending ? (
        <Skeleton height="120px" borderRadius="md" />
      ) : agentCard ? (
        <SectionCard title={t('A2A Agent Card')}>
          <DetailRow label={t('Version')}>
            <Text textStyle="bodyM" color="text-primary">
              {agentCard.version || '-'}
            </Text>
          </DetailRow>
          <DetailRow label={t('Streaming')}>
            <Badge colorPalette={agentCard.capabilities.streaming ? 'green' : 'gray'}>
              {agentCard.capabilities.streaming ? t('Enabled') : t('Disabled')}
            </Badge>
          </DetailRow>
          {agentCard.defaultInputModes.length > 0 && (
            <DetailRow label={t('Input Modes')}>
              <Text textStyle="bodyM" color="text-primary">
                {agentCard.defaultInputModes.join(', ')}
              </Text>
            </DetailRow>
          )}
          {agentCard.defaultOutputModes.length > 0 && (
            <DetailRow label={t('Output Modes')}>
              <Text textStyle="bodyM" color="text-primary">
                {agentCard.defaultOutputModes.join(', ')}
              </Text>
            </DetailRow>
          )}
          {agentCard.url && (
            <DetailRow label={t('Endpoint')}>
              <EndpointLink href={agentCard.url} />
            </DetailRow>
          )}
        </SectionCard>
      ) : null}

      {agentCard && agentCard.skills.length > 0 && (
        <SectionCard title={t('Skills')}>
          {agentCard.skills.map((skill, index) => (
            <DetailRow key={skill.id || index} label={skill.name || skill.id}>
              {skill.description ? (
                <Text textStyle="bodyM" color="text-primary">
                  {skill.description}
                </Text>
              ) : (
                <Wrap justify="flex-end">
                  <Badge bg="bg-alt-primary" color="text-primary">
                    {skill.id}
                  </Badge>
                </Wrap>
              )}
            </DetailRow>
          ))}
        </SectionCard>
      )}
    </Stack>
  )
}
