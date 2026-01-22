'use client'

import { Flex, Heading, Skeleton, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NotFound } from '@/components/error/NotFound'
import { TransactionViews } from '@/components/TransactionViews'
import { VETBalance } from '@/components/ui/Balance'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { IDChip } from '@/components/ui/IDChip'
import { BaseLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { type Transaction, type TransactionId, type TransactionReceipt } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import { useFormatNumber } from '@/hooks/useFormatting'
import { TransactionDetailsView } from '@/lib/types'

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
    router.replace(`/transactions/${transaction.id}?view=${newView}`, { scroll: false })
  }

  if (receipt === undefined) {
    throw new Error('Could not fetch Transaction receipt')
  }

  const currentView = (view as TransactionDetailsView) || TransactionDetailsView.TRANSACTION

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
  view = TransactionDetailsView.TRANSACTION,
  onViewChange,
}: {
  view: TransactionDetailsView
  transaction: Transaction
  receipt: TransactionReceipt | null
  onViewChange: (view: TransactionDetailsView) => void
}) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const viewOptions: ToggleOption<TransactionDetailsView>[] = useMemo(
    () => [
      { value: TransactionDetailsView.TRANSACTION, label: t('Transaction') },
      { value: TransactionDetailsView.CLAUSES, label: t('Clauses') },
      { value: TransactionDetailsView.EVENTS, label: t('Events') },
    ],
    [t],
  )

  return (
    <Card variant="primary">
      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
          {t('Transaction')}
        </Heading>
        <IDChip value={transaction.id} />
      </Flex>

      <DataCardGroup
        variant="outline"
        desktopColumns={3}
        items={
          [
            {
              icon: <Image src="/icons/block-number.svg" alt="Block Number" />,
              title: t('Block Number'),
              children: (
                <BaseLink href={`/block/${transaction.meta.blockID}`}>
                  #{formatNumber(transaction.meta.blockNumber)}
                </BaseLink>
              ),
            },
            {
              icon: <Image src="/icons/clause.svg" alt="Clauses" />,
              title: t('Total Clauses'),
              children: (
                <BaseLink href={`/transactions/${transaction.id}?view=clauses`}>{transaction.clauses.length}</BaseLink>
              ),
            },
            {
              icon: <Image src="/icons/reward.svg" alt="Rewards" />,
              title: t('Rewards'),
              children: receipt ? <VETBalance balance={receipt.reward} justifyContent="flex-start" /> : <Text>-</Text>,
            },
          ] as DataCardGroupItem[]
        }
      />

      <Flex>
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
  )
}
