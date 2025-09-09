'use client'

import { Flex, Stack } from '@chakra-ui/react'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { CopyToClipBoard } from '@/components/ui/CopyToClipBoard'
import { Subtitle, Title } from '@/components/ui/Typography'
import type { HexString } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import { DynamicFeeTransaction } from './components/DynamicFeeTransaction'
import { LegacyTransaction } from './components/LegacyTransaction'

export default function TransactionPage({ params }: { params: Promise<{ transactionId: HexString }> }) {
  const { transactionId } = use(params)

  if (!transactionId) {
    notFound()
  }

  return <TransactionDetails transactionId={transactionId} />
}

const TransactionDetails = ({ transactionId }: { transactionId: HexString }) => {
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
        <Subtitle>{transaction.id.toString()}</Subtitle>
        <CopyToClipBoard value={transaction.id.toString()} />
      </Flex>

      {transaction.type === 81 ? (
        <DynamicFeeTransaction tx={transaction} receipt={receipt ?? undefined} />
      ) : (
        <LegacyTransaction tx={transaction} receipt={receipt ?? undefined} />
      )}
    </Stack>
  )
}
