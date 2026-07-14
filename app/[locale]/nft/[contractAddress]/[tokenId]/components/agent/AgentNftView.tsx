'use client'

import { Badge, Flex, Grid, Heading, Stack, Tabs } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import type { NftMetadata } from '@/services/nft-metadata'
import { useAgentCard } from '@/services/agent-nft/hooks'
import { type AgentRegistration, getAgentCardEndpoint } from '@/services/agent-nft/schemas'
import type { Erc721 } from '@/services/thor/tokens/erc721'
import { useAgentInfo } from '@/services/thor/tokens/agent-registry'
import { useAgentReputation } from '@/services/thor/tokens/reputation-registry'
import { NftDetailHeader } from '../NftDetailHeader'
import { NftDetailsSection } from '../NftDetailsSection'
import { NftStatsCards } from '../NftStatsCards'
import { NftTransfersSection } from '../NftTransfersSection'
import { OverviewTab } from './tabs/OverviewTab'
import { ServicesTab } from './tabs/ServicesTab'
import { StatisticsTab } from './tabs/StatisticsTab'
import { QualityTab } from './tabs/QualityTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { MetadataTab } from './tabs/MetadataTab'

interface AgentNftViewProps {
  contractAddress: AddressString
  tokenId: bigint
  collection: Erc721
  registration: AgentRegistration
  nftImage: string
  tokenUri: string | undefined
  metadata: NftMetadata | null | undefined
}

export const AgentNftView = ({
  contractAddress,
  tokenId,
  collection,
  registration,
  nftImage,
  tokenUri,
  metadata,
}: AgentNftViewProps) => {
  const { t } = useTranslation()

  const nftName = registration.name || collection.name || `#${tokenId.toString()}`
  // The agent NFT contract is itself the ERC-8004 AgentRegistry (tokenId == agentId).
  const { data: agentInfo, isPending: isAgentInfoPending } = useAgentInfo({ contractAddress, agentId: tokenId })

  const reputationAddress = registration.reputationRegistry?.address ?? null
  const { data: reputation, isPending: isReputationPending } = useAgentReputation({
    reputationAddress,
    agentId: tokenId,
  })
  const hasReputationRegistry = !!reputationAddress

  const agentCardEndpoint = getAgentCardEndpoint(registration)
  const { data: agentCard, isPending: isAgentCardPending } = useAgentCard({ endpoint: agentCardEndpoint })

  return (
    <Card variant="primary">
      <Flex alignItems="center" gap={3} flexWrap="wrap">
        <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap">
          {t('AI Agent')}
        </Heading>
        <Badge colorPalette="purple">{t('Agent')}</Badge>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '322px 1fr' }} gap={5} alignItems="start">
        <NftDetailHeader
          nftImage={nftImage}
          nftName={nftName}
          tokenId={tokenId}
          collection={collection}
          contractAddress={contractAddress}
          description={registration.description ?? undefined}
        />

        <Stack gap={4} flex={1} minWidth={0}>
          <NftStatsCards contractAddress={contractAddress} tokenId={tokenId} />

          <Tabs.Root defaultValue="overview" variant="line" lazyMount unmountOnExit>
            <Tabs.List overflowX="auto" flexWrap="nowrap">
              <Tabs.Trigger value="overview">{t('Overview')}</Tabs.Trigger>
              <Tabs.Trigger value="services">{t('Services')}</Tabs.Trigger>
              <Tabs.Trigger value="statistics">{t('Statistics')}</Tabs.Trigger>
              <Tabs.Trigger value="quality">{t('Quality')}</Tabs.Trigger>
              <Tabs.Trigger value="feedback">{t('Feedback')}</Tabs.Trigger>
              <Tabs.Trigger value="nft">{t('NFT')}</Tabs.Trigger>
              <Tabs.Trigger value="metadata">{t('Metadata')}</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="overview">
              <OverviewTab registration={registration} agentInfo={agentInfo} isAgentInfoPending={isAgentInfoPending} />
            </Tabs.Content>
            <Tabs.Content value="services">
              <ServicesTab registration={registration} agentCard={agentCard} isAgentCardPending={isAgentCardPending} />
            </Tabs.Content>
            <Tabs.Content value="statistics">
              <StatisticsTab
                reputation={reputation}
                isPending={isReputationPending}
                hasReputationRegistry={hasReputationRegistry}
              />
            </Tabs.Content>
            <Tabs.Content value="quality">
              <QualityTab
                reputation={reputation}
                isPending={isReputationPending}
                hasReputationRegistry={hasReputationRegistry}
              />
            </Tabs.Content>
            <Tabs.Content value="feedback">
              <FeedbackTab
                reputation={reputation}
                isPending={isReputationPending}
                hasReputationRegistry={hasReputationRegistry}
              />
            </Tabs.Content>
            <Tabs.Content value="nft">
              <NftDetailsSection
                collection={collection}
                contractAddress={contractAddress}
                tokenId={tokenId}
                metadata={metadata}
              />
            </Tabs.Content>
            <Tabs.Content value="metadata">
              <MetadataTab
                registration={registration}
                contractAddress={contractAddress}
                tokenId={tokenId}
                tokenUri={tokenUri}
              />
            </Tabs.Content>
          </Tabs.Root>
        </Stack>
      </Grid>

      <NftTransfersSection contractAddress={contractAddress} tokenId={tokenId} />
    </Card>
  )
}
