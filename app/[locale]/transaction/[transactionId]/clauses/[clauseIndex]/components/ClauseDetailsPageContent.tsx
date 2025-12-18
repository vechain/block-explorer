'use client'

import { Group, Stack, Tabs, Text } from '@chakra-ui/react'
import { notFound, useRouter } from 'next/navigation'
import { AiOutlineWechat } from 'react-icons/ai'
import { LuInfo } from 'react-icons/lu'
import { TbTransfer } from 'react-icons/tb'
import { VscNewFile } from 'react-icons/vsc'
import { useTranslation } from 'react-i18next'
import { NoContractCreation, NoEvents, NoTransfers } from '@/components/NoResults'
import { Pagination } from '@/components/ui-legacy/Pagination'
import { Subtitle, Title } from '@/components/ui-legacy/Typography'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import { VETTransferTable } from '@/components/VETTransferTable'
import { useTabs } from '@/hooks/useTabs'
import { type AddressString, type Transaction, type TransactionId, type TransactionReceipt } from '@/lib/schemas'
import { useTransaction, useTransactionReceipt } from '@/services/thor/hooks'
import { ClauseDetailsTable } from './ClauseDetailsTable'
import { EventList } from './EventList'

export const ClauseDetailsPageContent = ({
  transactionId,
  clauseIndex,
}: {
  transactionId: TransactionId
  clauseIndex: number
}) => {
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
  const { currentTab, handleTabChange } = useTabs('details')
  const { t } = useTranslation()
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
        <Title>{t('Clause details')}</Title>
        <Subtitle>
          {(clauseIndex + 1).toLocaleString()} {t('of')} {tx.clauses.length}
        </Subtitle>
      </Group>

      <Tabs.Root value={currentTab} onValueChange={handleTabChange} variant="subtle" lazyMount>
        <Tabs.List bg="bg.muted" rounded="l3">
          <Tabs.Trigger value="details">
            <LuInfo />
            {t('Details')}
          </Tabs.Trigger>
          <Tabs.Trigger value="events" disabled={!hasEvents}>
            <AiOutlineWechat />
            {t('Events')}
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers" disabled={!hasTransfers}>
            <TbTransfer />
            {t('VET Transfers')}
          </Tabs.Trigger>
          <Tabs.Trigger value="contract-creation" disabled={!output.contractAddress}>
            <VscNewFile />
            {t('Contract created')}
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
  const { t } = useTranslation()

  return (
    <Group gap={2}>
      <Text fontWeight="bold">{t('Created contract address')}</Text>
      <VnsBadgeOrAddressLink address={address} />
    </Group>
  )
}
