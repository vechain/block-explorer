'use client'

import { Flex, Heading, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useAccountTokens } from '@/hooks/useAccountTokens'
import { useVnsName } from '@/services/thor/vns'
import { TokensSection } from './sections/TokensSection'
import { useSettingsStore } from '@/lib/stores/settings'
import { getTokenRegistryEntry } from '@/lib/constants/token-registry'
import { KnownContractSection } from './KnownContractSection'

export const ContractSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const { data: vnsName } = useVnsName(address)
  const activeNetwork = useSettingsStore(state => state.activeNetwork)
  const { tokenBalanceRows, tokenValueRows, totalValue, isPendingAll: isPendingAllTokens } = useAccountTokens(address)

  // Check if this contract is a known token from the registry
  const tokenRegistryEntry = useMemo(
    () => getTokenRegistryEntry(activeNetwork.name, address),
    [activeNetwork.name, address],
  )

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Contract')}
          </Heading>
          <IDChip value={address} vnsName={vnsName} />
        </Flex>

        {/* Show known token info if contract is in the token registry */}
        {tokenRegistryEntry && <KnownContractSection token={tokenRegistryEntry} />}

        <TokensSection
          tokenBalanceRows={tokenBalanceRows}
          tokenValueRows={tokenValueRows}
          totalValue={totalValue}
          isPending={isPendingAllTokens}
        />
      </Card>
    </Stack>
  )
}
