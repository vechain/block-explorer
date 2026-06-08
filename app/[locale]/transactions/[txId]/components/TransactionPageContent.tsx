'use client'

import { Flex, Heading, Skeleton, Stack, Switch, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionInsight } from '@/components/TransactionInsights'
import { TransactionOverview } from '@/components/TransactionOverview'
import { TransactionViews } from '@/components/TransactionViews'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { IDChip } from '@/components/ui/IDChip'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { useFormatDate, useFormatNumber } from '@/hooks/useFormatting'
import { useRedirectOnNotFound } from '@/hooks/useRedirectOnNotFound'
import { type Transaction, type TransactionId, type TransactionReceipt } from '@/lib/schemas'
import { type NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { TransactionDetailsView } from '@/lib/types'
import { getNetworkNameFromSearchParams } from '@/lib/utils/network'
import { useTransaction, useTransactionReceipt } from '@/services/thor/transaction'

export const TransactionPageContent = ({
  transactionId,
  view,
}: {
  transactionId: TransactionId
  view: string | undefined
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const requestedNetworkName = getNetworkNameFromSearchParams(searchParams)
  const transactionNetworkName = requestedNetworkName ?? activeNetworkName
  const { data: transaction, isPending: isTransactionPending } = useTransaction(transactionId, transactionNetworkName)
  const { data: receipt, isPending: isReceiptPending } = useTransactionReceipt(transactionId, transactionNetworkName)

  const isNotFound = useRedirectOnNotFound({
    isNotFound: !isTransactionPending && !transaction,
  })

  if (isTransactionPending || isReceiptPending || isNotFound || !transaction)
    return <Skeleton height="400px" width="100%" />

  const handleViewChange = (newView: TransactionDetailsView) => {
    router.replace(getTransactionHref(pathname, searchParams, { view: newView }, DETAILS_CARD_ID), { scroll: false })
  }

  if (receipt === undefined) {
    throw new Error('Could not fetch Transaction receipt')
  }

  const currentView = getTransactionDetailsView(view)

  return (
    <TransactionDetails
      transaction={transaction}
      receipt={receipt}
      networkName={transactionNetworkName}
      view={currentView}
      onViewChange={handleViewChange}
    />
  )
}

const TransactionDetails = ({
  transaction,
  receipt,
  networkName,
  view = TransactionDetailsView.CLAUSES,
  onViewChange,
}: {
  view: TransactionDetailsView
  transaction: Transaction
  receipt: TransactionReceipt | null
  networkName: NetworkName
  onViewChange: (view: TransactionDetailsView) => void
}) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const formatNumber = useFormatNumber()
  // Expert mode reveals the technical-details grid, fees/gas breakdown, the
  // Raw/Decoded toggle on each clause's input data, and the topics + data hex
  // under every event. Default is the lean meaningful view.
  const [expert, setExpert] = useState(false)

  const viewOptions: ToggleOption<TransactionDetailsView>[] = useMemo(
    () => [
      { value: TransactionDetailsView.CLAUSES, label: `${t('Clauses')} (${transaction.clauses.length})` },
      { value: TransactionDetailsView.EVENTS, label: `${t('Events')} (${countEvents(receipt)})` },
    ],
    [t, transaction.clauses.length, receipt],
  )

  return (
    <Stack gap="8">
      <Card variant="primary">
        <Stack gap="3">
          <Flex alignItems="center" justifyContent="space-between" gap="4" flexWrap="wrap">
            <Flex alignItems="center" gap="4" flexWrap="wrap">
              <Heading as="h2" textStyle="displayXs">
                {t('Transaction')}
              </Heading>
            </Flex>

            <Flex alignItems="center" gap="4" flexWrap="wrap">
              <Switch.Root
                checked={expert}
                onCheckedChange={e => setExpert(e.checked)}
                size="sm"
                aria-label={t('Expert mode')}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>
                  <Text textStyle="bodyS" color="text-secondary">
                    <Text as="span" fontWeight="medium" color="text-primary">
                      {t('Expert')}
                    </Text>{' '}
                    {t('mode')}
                  </Text>
                </Switch.Label>
              </Switch.Root>
            </Flex>
          </Flex>
          <IDChip value={transaction.id} />
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

        <TransactionOverview transaction={transaction} receipt={receipt} networkName={networkName} />

        <TransactionInsight transaction={transaction} receipt={receipt} networkName={networkName} expert={expert} />
      </Card>

      <Card variant="primary" id={DETAILS_CARD_ID}>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="4">
          <Heading as="h2" textStyle="displayXs">
            {t('Activity')}
          </Heading>

          <ToggleGroup
            layoutId="transaction-view-switch"
            options={viewOptions}
            value={view}
            onChange={onViewChange}
            size="sm"
          />
        </Flex>

        <TransactionViews transaction={transaction} receipt={receipt} view={view} expert={expert} />
      </Card>
    </Stack>
  )
}

const countEvents = (receipt: TransactionReceipt | null): number => {
  if (!receipt) return 0
  return receipt.outputs.reduce((sum, o) => sum + o.events.length, 0)
}

const DETAILS_CARD_ID = 'transaction-details'

const getTransactionDetailsView = (view: string | undefined): TransactionDetailsView => {
  if (view === TransactionDetailsView.EVENTS) return TransactionDetailsView.EVENTS

  return TransactionDetailsView.CLAUSES
}

const getTransactionHref = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  updates: Partial<Record<'network' | 'view', string>>,
  hash?: string,
) => {
  const nextSearchParams = new URLSearchParams(searchParams.toString())

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      nextSearchParams.set(key, value)
      return
    }

    nextSearchParams.delete(key)
  })

  const queryString = nextSearchParams.toString()
  const hashSuffix = hash ? `#${hash}` : ''

  return queryString ? `${pathname}?${queryString}${hashSuffix}` : `${pathname}${hashSuffix}`
}
