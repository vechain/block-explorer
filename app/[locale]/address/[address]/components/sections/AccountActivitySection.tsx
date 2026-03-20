'use client'

import { Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { LuArrowDownLeft, LuArrowUpRight, LuFlame } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { Balance, VETBalance, VTHOBalance } from '@/components/ui/Balance'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { useFormatDate } from '@/hooks/useFormatting'
import type { AddressString } from '@/lib/schemas'
import { useContract } from '@/services/veworld-indexer/contracts'
import { useAccountOverview } from '@/services/veworld-indexer/account-overview'

export const AccountActivitySection = ({
  address,
  isContract = false,
}: {
  address: AddressString
  isContract?: boolean
}) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const { data: overview } = useAccountOverview(address)
  const { data: contract, isPending: isContractPending } = useContract({ address, enabled: isContract })

  const items: DataCardGroupItem[] = [
    ...(isContract
      ? [
          {
            icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
            title: t('Contract creation'),
            children: isContractPending ? (
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
            children: isContractPending ? (
              <Skeleton height="24px" width="120px" />
            ) : contract?.master ? (
              <CopyableAddressLink truncate address={contract.master} />
            ) : (
              <Text color="text-secondary">-</Text>
            ),
          },
          {
            icon: <Image src="/icons/transaction.svg" alt="Transactions" width={24} height={24} />,
            title: t('Creation Transaction'),
            children: isContractPending ? (
              <Skeleton height="24px" width="120px" />
            ) : contract?.deploymentTxId ? (
              <CopyableTransactionIdLink txId={contract.deploymentTxId} />
            ) : (
              <Text color="text-secondary">-</Text>
            ),
          },
        ]
      : []),
    {
      icon: <LuArrowDownLeft />,
      title: t('Total VET Received'),
      children: <VETBalance balance={BigInt(overview?.vetReceived ?? '0')} />,
    },
    {
      icon: <LuArrowUpRight />,
      title: t('Total VET Sent'),
      children: <VETBalance balance={BigInt(overview?.vetSent ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('Gas Used'),
      children: <Balance balance={BigInt(overview?.gasUsed ?? '0')} symbol="VTHO" decimals={5} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Burned'),
      children: <VTHOBalance balance={BigInt(overview?.vthoBurned ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Delegated'),
      children: <VTHOBalance balance={BigInt(overview?.vthoDelegated ?? '0')} />,
    },
  ]

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Activity')}
      </Heading>
      <Stack gap="4">
        <DataCardGroup items={items} desktopColumns={3} />
      </Stack>
    </Card>
  )
}
