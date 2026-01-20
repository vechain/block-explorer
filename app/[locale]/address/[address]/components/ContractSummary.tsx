'use client'

import { Flex, Grid, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import type { AddressString } from '@/lib/schemas'
import { useContract } from '@/services/veworld-indexer/hooks'
import { useFormatDate } from '@/hooks/useFormatting'
import { useAccountTokens } from '@/hooks/useAccountTokens'
import { useVnsName } from '@/services/thor/hooks'
import { TokenBalanceSection } from './sections/TokenBalanceSection'
import { TokenValueSection } from './sections/TokenValueSection'
import { AddressLink, BaseLink } from '@/components/ui/Links'

export const ContractSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const { data: vnsName } = useVnsName(address)
  const {
    tokenBalanceRows,
    tokenValueRows,
    totalValue,
    isPending: isPendingTokens,
    isPendingAll: isPendingAllTokens,
  } = useAccountTokens(address)
  const { data: contract, isPending: isContractPending } = useContract({ address })

  const isPending = isPendingTokens || isContractPending

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Contract')}
          </Heading>
          <IDChip value={address} vnsName={vnsName} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          <DataCard
            variant="secondary"
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('Contract creation')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {formatDate(contract?.createdOn ?? 0)}
              </Text>
            )}
          </DataCard>

          <DataCard
            variant="secondary"
            icon={<Image src="/icons/calendar.svg" alt="Calendar" />}
            title={t('Contract Master')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <AddressLink truncate address={contract?.master ?? '0x'} />
            )}
          </DataCard>

          <DataCard
            variant="secondary"
            icon={<Image src="/icons/transaction.svg" alt="Transactions" />}
            title={t('Creation Transaction')}
          >
            {isPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <BaseLink href={`/transaction/${contract?.deploymentTxId ?? '0x'}`} whiteSpace="nowrap">
                <Text overflow="hidden" textOverflow="ellipsis">
                  {contract?.deploymentTxId ?? '0x'}
                </Text>
              </BaseLink>
            )}
          </DataCard>
        </Flex>

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 5, md: 5 }}>
          <TokenBalanceSection tokenBalanceRows={tokenBalanceRows} isPending={isPendingTokens} />
          <TokenValueSection tokenValueRows={tokenValueRows} totalValue={totalValue} isPending={isPendingAllTokens} />
        </Grid>
      </Card>
    </Stack>
  )
}
