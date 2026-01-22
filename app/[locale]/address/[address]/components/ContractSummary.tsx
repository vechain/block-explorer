'use client'

import { Flex, Grid, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
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
import { truncateHex } from '@/lib/utils/truncateHex'

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

        <DataCardGroup items={contractDataCards} desktopColumns={3} variant="outline" />

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 5, md: 5 }}>
          <TokenBalanceSection tokenBalanceRows={tokenBalanceRows} isPending={isPendingTokens} />
          <TokenValueSection tokenValueRows={tokenValueRows} totalValue={totalValue} isPending={isPendingAllTokens} />
        </Grid>
      </Card>
    </Stack>
  )
}
