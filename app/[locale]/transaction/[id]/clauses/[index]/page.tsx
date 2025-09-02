'use client'

import { Group, Stack, Tabs, Text } from '@chakra-ui/react'
import type { Hex } from '@vechain/sdk-core'
import type { TransactionReceipt } from '@vechain/sdk-network'
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
import { type AddressString, addressStringSchema } from '@/lib/schemas'
import { parseHex } from '@/lib/utils/hex'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import type { TransactionDetail } from '@/services/thor/transaction'
import { ClauseDetailsTable } from './components/ClauseDetailsTable'
import { EventList } from './components/EventList'

export default function ClauseDetailsPage({ params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = use(params)

  const transactionId = parseHex(id)
  const clauseIndex = parseInt(index ?? '0', 10)

  if (!transactionId) {
    notFound()
  }

  return <ClauseTransactionLoader transactionId={transactionId} clauseIndex={clauseIndex} />
}

const ClauseTransactionLoader = ({ transactionId, clauseIndex }: { transactionId: Hex; clauseIndex: number }) => {
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
  tx: TransactionDetail
  receipt: TransactionReceipt
  clauseIndex: number
}) => {
  const txId = tx.id.toString()
  const clause = tx.clauses[clauseIndex]
  const output = receipt.outputs[clauseIndex] ?? { events: [], transfers: [], contractAddress: null }

  const hasEvents = output.events.length > 0
  const hasTransfers = output.transfers.length > 0
  const hasContractCreation = !!output.contractAddress

  const router = useRouter()

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
          <Tabs.Trigger value="contract-creation" disabled={!hasContractCreation}>
            <VscNewFile />
            Contract created
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <Tabs.Content value="details">
          <ClauseDetailsTable clause={clause} txId={txId} clauseIndex={clauseIndex} />
        </Tabs.Content>
        <Tabs.Content value="events">{hasEvents ? <EventList eventLogs={output.events} /> : <NoEvents />}</Tabs.Content>
        <Tabs.Content value="transfers">
          {hasTransfers ? <VETTransferTable transfers={output.transfers} /> : <NoTransfers />}
        </Tabs.Content>
        <Tabs.Content value="contract-creation">
          {hasContractCreation ? (
            <CreatedContract address={addressStringSchema.parse(output.contractAddress)} />
          ) : (
            <NoContractCreation />
          )}
        </Tabs.Content>
      </Tabs.Root>

      {tx.clauses.length > 1 && (
        <Pagination
          page={clauseIndex}
          hasNext={clauseIndex < tx.clauses.length - 1}
          onPageChange={page => {
            router.push(`/transaction/${txId}/clauses/${page - 1}`)
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
