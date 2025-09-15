'use client'

import { Flex, Stack } from '@chakra-ui/react'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { CopyToClipBoard } from '@/components/ui/CopyToClipBoard'
import { Subtitle, Title } from '@/components/ui/Typography'
import { type TransactionId, transactionIdSchema, transactionTypeSchema } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import { DynamicFeeTransaction } from './components/DynamicFeeTransaction'
import { LegacyTransaction } from './components/LegacyTransaction'

export default function TransactionPage({ params }: { params: Promise<{ transactionId: TransactionId }> }) {
  const { transactionId } = use(params)

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success) {
    notFound()
  }

  return <TransactionDetails transactionId={transactionId} />
}

const TransactionDetails = ({ transactionId }: { transactionId: TransactionId }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId)
  const { data: receipt, isLoading: isReceiptLoading } = useTransactionReceipt(transactionId)

  if (isLoading || isReceiptLoading) return <div>Loading...</div>

  if (!transaction) {
    notFound()
  }

  return (
    <Stack>
      <Title>Transaction details</Title>
      <Flex alignItems="center" gap={2}>
        <Subtitle>{transaction.id}</Subtitle>
        <CopyToClipBoard value={transaction.id} />
      </Flex>

      {transaction.type === transactionTypeSchema.enum.DYNAMIC_FEE ? (
        <DynamicFeeTransaction tx={transaction} receipt={receipt ?? undefined} />
      ) : (
        <LegacyTransaction tx={transaction} receipt={receipt ?? undefined} />
      )}
    </Stack>
  )
}
