'use client'

import { Flex, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useContract } from '@/services/veworld-indexer/hooks'
import { useFormatDate } from '@/hooks/useFormatting'
import { useAccountTokens } from '@/hooks/useAccountTokens'
import { useVnsName } from '@/services/thor/hooks'
import { TokensSection } from './sections/TokensSection'
import { AddressLink, BaseLink } from '@/components/ui/Links'
import { truncateHex } from '@/lib/utils/truncateHex'
import { useSettingsStore } from '@/lib/stores/settings'
import { getTokenRegistryEntry } from '@/lib/constants/token-registry'
import { KnownContractSection } from './KnownContractSection'

export const ContractSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const { data: vnsName } = useVnsName(address)
  const activeNetwork = useSettingsStore(state => state.activeNetwork)
  const { tokenBalanceRows, tokenValueRows, totalValue, isPendingAll: isPendingAllTokens } = useAccountTokens(address)
  const { data: contract, isPending: isContractPending } = useContract({ address })

  // Check if this contract is a known token from the registry
  const tokenRegistryEntry = useMemo(
    () => getTokenRegistryEntry(activeNetwork.name, address),
    [activeNetwork.name, address],
  )

  const isPending = isPendingAllTokens || isContractPending

  const contractDataCards: DataCardGroupItem[] = [
    {
      icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
      title: t('Contract creation'),
      children: isPending ? (
        <Skeleton height="24px" width="120px" />
      ) : (
        <Text textStyle="bodyL" color="text-primary">
          {formatDate(contract?.createdOn ?? 0)}
        </Text>
      ),
    },
    {
      icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
      title: t('Contract Master'),
      children: isPending ? (
        <Skeleton height="24px" width="120px" />
      ) : (
        <AddressLink truncate address={contract?.master ?? '0x'} />
      ),
    },
    {
      icon: <Image src="/icons/transaction.svg" alt="Transactions" width={24} height={24} />,
      title: t('Creation Transaction'),
      children: isPending ? (
        <Skeleton height="24px" width="120px" />
      ) : (
        <BaseLink href={`/transactions/${contract?.deploymentTxId ?? '0x'}`}>
          {truncateHex(contract?.deploymentTxId ?? '0x')}
        </BaseLink>
      ),
    },
  ]

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

        <DataCardGroup items={contractDataCards} desktopColumns={3} variant="outline" />

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
