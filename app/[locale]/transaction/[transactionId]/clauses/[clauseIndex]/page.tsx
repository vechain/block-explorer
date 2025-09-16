'use client'

import { Group, Stack, Tabs, Text } from '@chakra-ui/react'
import { notFound, useRouter } from 'next/navigation'
import { use } from 'react'
import { AiOutlineWechat } from 'react-icons/ai'
import { LuInfo } from 'react-icons/lu'
import { TbTransfer } from 'react-icons/tb'
import { VscNewFile } from 'react-icons/vsc'
import { NoContractCreation, NoEvents, NoTransfers } from '@/components/NoResults'
import { Pagination } from '@/components/ui/Pagination'
import { Subtitle, Title } from '@/components/ui/Typography'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import { VETTransferTable } from '@/components/VETTransferTable'
import type { AddressString, HexString, Transaction, TransactionReceipt } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import { ClauseDetailsTable } from './components/ClauseDetailsTable'
import { EventList } from './components/EventList'

export default function ClauseDetailsPage({
  params,
}: {
  params: Promise<{ transactionId: HexString; clauseIndex: number }>
}) {
  const { transactionId, clauseIndex } = use(params)

  const clauseIndexNumber = Number(clauseIndex)

  if (!transactionId || Number.isNaN(clauseIndexNumber)) {
    notFound()
  }

  return <ClauseTransactionLoader transactionId={transactionId} clauseIndex={clauseIndexNumber} />
}

const ClauseTransactionLoader = ({ transactionId, clauseIndex }: { transactionId: HexString; clauseIndex: number }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId)
  const { data: receipt, isLoading: isReceiptLoading } = useTransactionReceipt(transactionId)

  if (isLoading || isReceiptLoading) return <div>Loading...</div>

  if (!transaction || !receipt) {
    notFound()
  }

  return <ClausePageContent tx={transaction} clauseIndex={clauseIndex} receipt={receipt} />
}

const ClausePageContent = ({
  tx,
  receipt,
  clauseIndex,
}: {
  tx: Transaction
  receipt: TransactionReceipt
  clauseIndex: number
}) => {
  const router = useRouter()

  const clause = tx.clauses[clauseIndex]
  const output = receipt.outputs[clauseIndex] ?? {
    events: [],
    transfers: [],
    contractAddress: null,
  }

  const hasEvents = output.events.length > 0
  const hasTransfers = output.transfers.length > 0

  return (
    <Stack gap="4">
      <Group alignItems="baseline" gap="4">
        <Title>Clause details</Title>
        <Subtitle>
          {(clauseIndex + 1).toLocaleString()} of {tx.clauses.length}
        </Subtitle>
      </Group>

      <Tabs.Root defaultValue="details" variant="subtle">
        <Tabs.List bg="bg.muted" rounded="l3">
          <Tabs.Trigger value="details">
            <LuInfo />
            Details
          </Tabs.Trigger>
          <Tabs.Trigger value="events" disabled={!hasEvents}>
            <AiOutlineWechat />
            Events
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers" disabled={!hasTransfers}>
            <TbTransfer />
            VET Transfers
          </Tabs.Trigger>
          <Tabs.Trigger value="contract-creation" disabled={!output.contractAddress}>
            <VscNewFile />
            Contract created
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <Tabs.Content value="details">
          <ClauseDetailsTable clause={clause} txId={tx.id} clauseIndex={clauseIndex} />
        </Tabs.Content>
        <Tabs.Content value="events">{hasEvents ? <EventList eventLogs={output.events} /> : <NoEvents />}</Tabs.Content>
        <Tabs.Content value="transfers">
          {hasTransfers ? <VETTransferTable transfers={output.transfers} /> : <NoTransfers />}
        </Tabs.Content>
        <Tabs.Content value="contract-creation">
          {output.contractAddress ? <CreatedContract address={output.contractAddress} /> : <NoContractCreation />}
        </Tabs.Content>
      </Tabs.Root>

      {tx.clauses.length > 1 && (
        <Pagination
          page={clauseIndex}
          hasNext={clauseIndex < tx.clauses.length - 1}
          onPageChange={page => {
            router.push(`/transaction/${tx.id}/clauses/${page}`)
          }}
        />
      )}
    </Stack>
  )
}

const CreatedContract = ({ address }: { address: AddressString }) => {
  return (
    <Group gap={2}>
      <Text fontWeight="bold">Created contract address</Text>
      <VnsBadgeOrAddressLink address={address} />
    </Group>
  )
}
