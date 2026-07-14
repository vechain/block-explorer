'use client'

import { Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { LuArrowDownLeft, LuArrowUpRight, LuFlame, LuHash, LuLayers, LuTag } from 'react-icons/lu'
import { Balance, VETBalance, VTHOBalance } from '@/components/ui/Balance'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/account-overview'
import { useContract } from '@/services/veworld-indexer/contracts'
import { useIsErc721Contract } from '@/hooks/useIsErc721Contract'
import { useErc721CollectionStats, useErc721Contract } from '@/services/thor/tokens/erc721'

export const AccountActivitySection = ({
  address,
  isContract = false,
  showSummaryCards = false,
}: {
  address: AddressString
  isContract?: boolean
  showSummaryCards?: boolean
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatDate = useFormatDate()
  const { data: overview, isPending: isOverviewPending } = useAccountOverview(address)
  const { data: contract, isPending: isContractPending } = useContract({ address, enabled: isContract })

  const isErc721 = useIsErc721Contract(address, { enabled: isContract })
  const { data: erc721Collection, isPending: isCollectionPending } = useErc721Contract({
    contractAddress: address,
    enabled: isErc721,
  })
  const { data: collectionStats } = useErc721CollectionStats({ contractAddress: address, enabled: isErc721 })

  const firstSeenDate = overview && overview.firstSeen > 0 ? formatDate(overview.firstSeen * 1000) : null
  const lastSeenDate = overview && overview.lastSeen > 0 ? formatDate(overview.lastSeen * 1000) : null

  // For an ERC-721 contract, show a focused collection view (name / symbol / supply
  // + creation metadata) instead of the generic VET/VTHO activity cards, which are
  // rarely meaningful for a token contract.
  const collectionItems: DataCardGroupItem[] = [
    {
      icon: <LuTag />,
      title: t('Name'),
      children: isCollectionPending ? (
        <Skeleton height="24px" width="120px" />
      ) : (
        <Text textStyle="bodyL" color={erc721Collection?.name ? 'text-primary' : 'text-secondary'}>
          {erc721Collection?.name || '-'}
        </Text>
      ),
    },
    {
      icon: <LuHash />,
      title: t('Symbol'),
      children: isCollectionPending ? (
        <Skeleton height="24px" width="80px" />
      ) : (
        <Text textStyle="bodyL" color={erc721Collection?.symbol ? 'text-primary' : 'text-secondary'}>
          {erc721Collection?.symbol || '-'}
        </Text>
      ),
    },
    {
      icon: <LuLayers />,
      title: t('Total Supply'),
      children: (
        <Text textStyle="bodyL" color={collectionStats?.totalSupply != null ? 'text-primary' : 'text-secondary'}>
          {collectionStats?.totalSupply != null ? formatNumber(Number(collectionStats.totalSupply)) : '-'}
        </Text>
      ),
    },
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

  const items: DataCardGroupItem[] = [
    ...(showSummaryCards
      ? [
          {
            icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
            title: t('First Seen'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color={firstSeenDate ? 'text-primary' : 'text-secondary'}>
                {firstSeenDate ?? '-'}
              </Text>
            ),
          },
          {
            icon: <Image src="/icons/calendar.svg" alt="Calendar" width={24} height={24} />,
            title: t('Last Seen'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="120px" />
            ) : (
              <Text textStyle="bodyL" color={lastSeenDate ? 'text-primary' : 'text-secondary'}>
                {lastSeenDate ?? '-'}
              </Text>
            ),
          },
          {
            icon: <Image src="/icons/transaction.svg" alt="Transactions" width={24} height={24} />,
            title: t('Total Transactions'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {overview ? formatNumber(overview.transactionsSent) : '0'}
              </Text>
            ),
          },
          {
            icon: <Image src="/icons/clause.svg" alt="Clauses" width={24} height={24} />,
            title: t('Total Clauses'),
            children: isOverviewPending ? (
              <Skeleton height="24px" width="80px" />
            ) : (
              <Text textStyle="bodyL" color="text-primary">
                {overview ? formatNumber(overview.clausesSent) : '0'}
              </Text>
            ),
          },
        ]
      : []),
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

  const showCollectionView = isContract && isErc721
  const displayedItems = showCollectionView ? collectionItems : items

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {showCollectionView ? t('Collection') : t('Activity')}
      </Heading>
      <Stack gap="4">
        <DataCardGroup items={displayedItems} desktopColumns={3} />
      </Stack>
    </Card>
  )
}
