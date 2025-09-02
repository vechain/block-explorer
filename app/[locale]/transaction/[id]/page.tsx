'use client'

import { Flex, Stack } from '@chakra-ui/react'
import type { Hex } from '@vechain/sdk-core'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { CopyToClipBoard } from '@/components/ui/CopyToClipBoard'
import { Subtitle, Title } from '@/components/ui/Typography'
import { parseHex } from '@/lib/utils/hex'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import { DynamicFeeTransaction } from './components/DynamicFeeTransaction'
import { LegacyTransaction } from './components/LegacyTransaction'

export default function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const transactionId = parseHex(id)

  if (!transactionId) {
    notFound()
  }

  return <TransactionDetails id={transactionId} />
}

const TransactionDetails = ({ id }: { id: Hex }) => {
  const { data: transaction, isLoading } = useTransaction(id)
  const { data: receipt, isLoading: isReceiptLoading } = useTransactionReceipt(id)

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
