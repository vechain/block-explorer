'use client'

import { Flex, Heading, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { notFound, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { SearchBar } from '@/components/navigation/SearchBar'
import { TransactionViews } from '@/components/TransactionViews'
import { VETBalance } from '@/components/ui/Balance'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { BaseLink } from '@/components/ui/Links'
import { Card } from '@/components/ui/Card'
import { ValueSwitch } from '@/components/ui/ValueSwitch'
import { type Transaction, type TransactionId, type TransactionReceipt } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'

enum TransactionDetailsView {
  TRANSACTION = 'transaction',
  CLAUSES = 'clauses',
}

export const TransactionPageContent = ({
  transactionId,
  view,
}: {
  transactionId: TransactionId
  view: string | undefined
}) => {
  const { data: transaction, isPending: isTransactionPending } = useTransaction(transactionId)
  const { data: receipt, isPending: isReceiptPending } = useTransactionReceipt(transactionId)
  const router = useRouter()

  if (isTransactionPending || isReceiptPending) return <div>Loading...</div>

  if (!transaction) {
    notFound()
  }

  const handleViewChange = (newView: TransactionDetailsView) => {
    router.replace(`/transaction/${transaction.id}?view=${newView}`, { scroll: false })
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
  return (
    <Stack gap="8">
      <SearchBar mt="16" />

      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Transaction')}
          </Heading>
          <IDChip value={transaction.id} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          {/* Block Number */}
          <DataCard
            icon={<Image src="/icons/block-number.svg" alt="Block Number" />}
            title={t('Block Number')}
            tooltip="Information coming soon"
          >
            <BaseLink href={`/block/${transaction.meta.blockID}`}>
              #{transaction.meta.blockNumber.toLocaleString()}
            </BaseLink>
          </DataCard>

          {/* Total Clauses */}
          <DataCard
            icon={<Image src="/icons/clause.svg" alt="Clauses" />}
            title={t('Total Clauses')}
            tooltip={t('Information coming soon')}
          >
            <BaseLink href={`/transaction/${transaction.id}?view=clauses`}>{transaction.clauses.length}</BaseLink>
          </DataCard>

          {/* Rewards */}
          <DataCard
            icon={<Image src="/icons/reward.svg" alt="Rewards" />}
            title={t('Rewards')}
            tooltip={t('Information coming soon')}
          >
            {receipt ? <VETBalance balance={receipt.reward} justifyContent="flex-start" /> : <Text>-</Text>}
          </DataCard>
        </Flex>

        <ValueSwitch
          layoutId="transaction-view"
          values={['transaction', 'clauses']}
          activeValue={view}
          onChange={value => onViewChange(value as TransactionDetailsView)}
        />

        <TransactionViews transaction={transaction} receipt={receipt} view={view} />
      </Card>
    </Stack>
  )
}
