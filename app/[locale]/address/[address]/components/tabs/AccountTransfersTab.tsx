'use client'

import { Badge, type BadgeProps, Stack, Table } from '@chakra-ui/react'
import { useState } from 'react'
import { NoTransfers } from '@/components/NoResults'
import { AmountWithHover } from '@/components/ui-legacy/AmountWithHover'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { BaseLink, TransactionLink } from '@/components/ui-legacy/Links'
import { Pagination } from '@/components/ui-legacy/Pagination'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { AddressString } from '@/lib/schemas'
import { type Erc20 } from '@/services/thor/tokens/erc20'
import { useAccountTransfersWithTokens } from '@/services/veworld-indexer/hooks'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 30

export const AccountTransfersTab = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const { transfers, erc20Map, isLoading } = useAccountTransfersWithTokens({
    params: { address, page, size: PAGE_SIZE },
  })

  if (isLoading) return <div>Loading...</div>
  if (!transfers || transfers.data.length === 0) return <NoTransfers />

  return (
    <Stack>
      <Table.ScrollArea borderWidth="1px" rounded="md">
        <Table.Root size="md" borderWidth="1px" rounded="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>{t('Tx ID')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('From')}</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
              <Table.ColumnHeader>{t('To')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('Amount')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('Token')}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <ErrorBoundary>
              {transfers.data.map(transfer => (
                <TransferRow
                  key={transfer.id}
                  transfer={transfer}
                  accountAddress={address}
                  token={transfer.tokenAddress ? erc20Map.get(transfer.tokenAddress) : undefined}
                />
              ))}
            </ErrorBoundary>
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination page={page} hasNext={transfers.pagination.hasNext} onPageChange={setPage} />
    </Stack>
  )
}

const TransferRow = ({
  transfer,
  accountAddress,
  token,
}: {
  transfer: IndexerTransfer
  accountAddress: AddressString
  token: Erc20 | null | undefined
}) => {
  const symbol = transfer.eventType === 'VET' ? 'VET' : (token?.symbol ?? '-')
  const decimals = token?.decimals ?? 18

  const isReceived = transfer.to.toLowerCase() === accountAddress.toLowerCase()

  return (
    <Table.Row key={transfer.id}>
      <Table.Cell maxW="150px">
        <TransactionLink transactionId={transfer.txId}>{transfer.txId}</TransactionLink>
      </Table.Cell>
      <Table.Cell>
        <VnsBadgeOrAddressLink truncateAddress address={transfer.from} />
      </Table.Cell>
      <Table.Cell>{isReceived ? <InBadge /> : <OutBadge />}</Table.Cell>
      <Table.Cell>
        <VnsBadgeOrAddressLink truncateAddress address={transfer.to} />
      </Table.Cell>
      <Table.Cell>
        <AmountWithHover amount={transfer.value} decimals={decimals} />
      </Table.Cell>
      <Table.Cell>
        {!transfer.tokenAddress ? 'VET' : <BaseLink to={`/address/${transfer.tokenAddress}`}>{symbol}</BaseLink>}
      </Table.Cell>
    </Table.Row>
  )
}

const InBadge = () => {
  return <InOutBadge colorPalette="green">IN</InOutBadge>
}

const OutBadge = () => {
  return <InOutBadge colorPalette="yellow">OUT</InOutBadge>
}

const InOutBadge = (props: BadgeProps) => {
  return <Badge w="40px" justifyContent="center" p={1} size="xs" {...props} />
}
