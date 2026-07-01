'use client'

import { Box, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { CopyableAddressLink } from '@/components/ui/Links'
import type { AddressString } from '@/lib/schemas'
import { type AgentRegistration, parseCaipAddress } from '@/services/agent-nft/schemas'
import { DetailRow, SectionCard } from '../AgentDetail'

interface MetadataTabProps {
  registration: AgentRegistration
  contractAddress: AddressString
  tokenId: bigint
  tokenUri: string | undefined
}

export const MetadataTab = ({ registration, contractAddress, tokenId, tokenUri }: MetadataTabProps) => {
  const { t } = useTranslation()
  const reputationAddress = registration.reputationRegistry?.address
  // Prefer the registry from the metadata's CAIP-10 reference; fall back to the NFT contract.
  const registryAddress = parseCaipAddress(registration.registrations[0]?.agentRegistry) ?? contractAddress

  return (
    <Stack gap={6}>
      <SectionCard title={t('On-chain Identity')}>
        <DetailRow label={t('Token ID')}>
          <Text textStyle="bodyM" color="text-primary">
            #{tokenId.toString()}
          </Text>
        </DetailRow>
        <DetailRow label={t('Agent Registry')}>
          <CopyableAddressLink address={registryAddress} truncate />
        </DetailRow>
        {reputationAddress && (
          <DetailRow label={t('Reputation Registry')}>
            <CopyableAddressLink address={reputationAddress as AddressString} truncate />
          </DetailRow>
        )}
        <DetailRow label={t('Schema')}>
          <Text textStyle="bodyS" color="text-primary" wordBreak="break-all">
            {registration.type}
          </Text>
        </DetailRow>
      </SectionCard>

      <SectionCard title={t('Raw Metadata')}>
        <Box px={{ base: 4, md: 6 }} py={4}>
          {tokenUri && (
            <Text textStyle="bodyS" color="text-secondary" mb={3} wordBreak="break-all">
              {tokenUri}
            </Text>
          )}
          <Box as="pre" bg="bg-alt-primary" borderRadius="md" p={4} overflowX="auto" fontSize="xs" color="text-primary">
            {JSON.stringify(registration, null, 2)}
          </Box>
        </Box>
      </SectionCard>
    </Stack>
  )
}
