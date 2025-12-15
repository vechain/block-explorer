'use client'

import { Flex, Heading, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'

import { notFound, useRouter } from 'next/navigation'
import { use } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchBar } from '@/components/navigation/SearchBar'
import { TransactionViews } from '@/components/TransactionViews'
import { VETBalance } from '@/components/ui/Balance'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { AddressLink, BaseLink } from '@/components/ui/Links'
import { Surface } from '@/components/ui/Surface'
import { ValueSwitch } from '@/components/ui/ValueSwitch'
import { type Transaction, type TransactionId, type TransactionReceipt, transactionIdSchema } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'

enum TransactionDetailsView {
  TRANSACTION = 'transaction',
  CLAUSES = 'clauses',
}

export default function TransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: TransactionId }>
  searchParams: Promise<{ view: TransactionDetailsView }>
}) {
  const { transactionId } = use(params)
  const { view } = use(searchParams)

  const { data: transaction, isPending: isTransactionPending } = useTransaction(transactionId)
  const { data: receipt, isPending: isReceiptPending } = useTransactionReceipt(transactionId)

  const router = useRouter()

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success) {
    notFound()
  }

  if (isTransactionPending || isReceiptPending) return <div>Loading...</div>

  if (!transaction) {
    notFound()
  }

  const handleViewChange = (view: TransactionDetailsView) => {
    router.replace(`/transaction/${transaction.id}?view=${view}`, { scroll: false })
  }

  if (receipt === undefined) {
    throw new Error('Could not fetch Transaction receipt')
  }

  return <TransactionDetails transaction={transaction} receipt={receipt} view={view} onViewChange={handleViewChange} />
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

      <Surface>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Transaction')}
          </Heading>
          <IDChip value={transaction.id} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
          {/* Date and time */}
          <DataCard
            icon={<Image src="/icons/block-number.svg" alt="Block Number" />}
            title={t('Block Number')}
            tooltip="Information coming soon"
          >
            <BaseLink href={`/block/${transaction.meta.blockID}`}>
              {transaction.meta.blockNumber.toLocaleString()}
            </BaseLink>
          </DataCard>

          {/* Clauses count */}
          <DataCard
            icon={<Image src="/icons/clause.svg" alt="Clauses" />}
            title={t('Total Clauses')}
            tooltip={t('Information coming soon')}
          >
            <Text>{transaction.clauses.length}</Text>
          </DataCard>

          {/* Beneficiary */}
          <DataCard
            icon={<Image src="/icons/reward.svg" alt="Rewards" />}
            title={t('Rewards')}
            tooltip={t('Information coming soon')}
          >
            {receipt ? <VETBalance balance={receipt.reward} /> : <Text>-</Text>}
          </DataCard>

          {/* Block signer */}
          <DataCard
            icon={<Image src="/icons/link.svg" alt="Origin" />}
            title={t('Origin')}
            tooltip={t('Information coming soon')}
          >
            <AddressLink address={transaction.origin} truncate />
          </DataCard>
        </Flex>

        <ValueSwitch
          layoutId="transaction-view"
          values={['transaction', 'clauses']}
          activeValue={view}
          onChange={value => onViewChange(value as TransactionDetailsView)}
        />

        <TransactionViews transaction={transaction} receipt={receipt} view={view} />
      </Surface>
    </Stack>
  )
}
