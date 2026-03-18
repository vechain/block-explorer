'use client'

import { Flex, Heading, Skeleton, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NotFound } from '@/components/error/NotFound'
import { TransactionInsight } from '@/components/TransactionInsights'
import { TxStatusBadge } from '@/components/TxStatus'
import { TransactionViews } from '@/components/TransactionViews'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { type Transaction, type TransactionId, type TransactionReceipt } from '@/lib/schemas'
import { TransactionDetailsView, TransactionStatus } from '@/lib/types'
import { useTransaction, useTransactionReceipt } from '@/services/thor/transaction'
import { CopyableString } from '@/components/ui/CopyableString'
import { truncateHex } from '@/lib/utils/truncateHex'

export const TransactionPageContent = ({
  transactionId,
  view,
}: {
  transactionId: TransactionId
  view: string | undefined
}) => {
  const { t } = useTranslation()
  const { data: transaction, isPending: isTransactionPending } = useTransaction(transactionId)
  const { data: receipt, isPending: isReceiptPending } = useTransactionReceipt(transactionId)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (isTransactionPending || isReceiptPending) return <Skeleton height="400px" width="100%" />

  if (!transaction) {
    return (
      <NotFound
        title={t('Transaction not found')}
        description={t('The transaction you are looking for does not exist')}
      />
    )
  }

  const handleViewChange = (newView: TransactionDetailsView) => {
    router.replace(getTransactionViewHref(pathname, searchParams, newView, DETAILS_CARD_ID), { scroll: false })
  }

  if (receipt === undefined) {
    throw new Error('Could not fetch Transaction receipt')
  }

  const currentView = getTransactionDetailsView(view)

  return (
    <TransactionDetails
      transaction={transaction}
      receipt={receipt}
      view={currentView}
      onViewChange={handleViewChange}
    />
  )
}

const TransactionDetails = ({
  transaction,
  receipt,
  view = TransactionDetailsView.CLAUSES,
  onViewChange,
}: {
  view: TransactionDetailsView
  transaction: Transaction
  receipt: TransactionReceipt | null
  onViewChange: (view: TransactionDetailsView) => void
}) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatNumber = useFormatNumber()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const status = receipt
    ? receipt.reverted
      ? TransactionStatus.REVERTED
      : TransactionStatus.SUCCESS
    : TransactionStatus.PENDING

  const viewOptions: ToggleOption<TransactionDetailsView>[] = useMemo(
    () => [
      { value: TransactionDetailsView.CLAUSES, label: t('Clauses') },
      { value: TransactionDetailsView.EVENTS, label: t('Events') },
    ],
    [t],
  )

  return (
    <Stack gap="8">
      <Card variant="primary">
        <Stack gap="3">
          <Flex alignItems="flex-start" justifyContent="space-between" gap="4">
            <Heading as="h2" textStyle="displayXs">
              {t('Transaction')}
            </Heading>
            <TxStatusBadge status={status} flexShrink={0} />
          </Flex>
          <Card variant="outline" p="2" w="fit-content">
            <CopyableString value={isMobile ? truncateHex(transaction.id, 16, 10) : transaction.id} truncate />
          </Card>
        </Stack>

        <DataCardGroup
          variant="outline"
          desktopColumns={3}
          items={
            [
              {
                icon: <Image src="/icons/group.svg" alt="Origin" />,
                title: t('Origin'),
                children: <CopyableAddressLink address={transaction.origin} truncate />,
              },
              {
                icon: <Image src="/icons/calendar.svg" alt="Timestamp" />,
                title: t('Timestamp'),
                children: <Text>{formatDate(transaction.meta.blockTimestamp)}</Text>,
              },
              {
                icon: <Image src="/icons/block-number.svg" alt="Block Number" />,
                title: t('Block Number'),
                children: (
                  <CopyableLink
                    href={`/block/${transaction.meta.blockID}`}
                    value={String(transaction.meta.blockNumber)}
                  >
                    #{formatNumber(transaction.meta.blockNumber)}
                  </CopyableLink>
                ),
              },
            ] as DataCardGroupItem[]
          }
        />

        <TransactionInsight transaction={transaction} receipt={receipt} />
      </Card>

      <Card variant="primary" id={DETAILS_CARD_ID}>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="4">
          <Heading as="h2" textStyle="displayXs">
            {view === TransactionDetailsView.EVENTS ? t('Events') : `${t('Clauses')} (${transaction.clauses.length})`}
          </Heading>

          <ToggleGroup
            layoutId="transaction-view-switch"
            options={viewOptions}
            value={view}
            onChange={onViewChange}
            size="sm"
          />
        </Flex>

        <TransactionViews transaction={transaction} receipt={receipt} view={view} />
      </Card>
    </Stack>
  )
}

const DETAILS_CARD_ID = 'transaction-details'

const getTransactionDetailsView = (view: string | undefined): TransactionDetailsView => {
  if (view === TransactionDetailsView.EVENTS) return TransactionDetailsView.EVENTS

  return TransactionDetailsView.CLAUSES
}

const getTransactionViewHref = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  view: TransactionDetailsView,
  hash?: string,
) => {
  const nextSearchParams = new URLSearchParams(searchParams.toString())
  nextSearchParams.set('view', view)

  const queryString = nextSearchParams.toString()
  const hashSuffix = hash ? `#${hash}` : ''

  return queryString ? `${pathname}?${queryString}${hashSuffix}` : `${pathname}${hashSuffix}`
}
