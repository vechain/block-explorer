'use client'

import { Badge, type BadgeProps, Stack, Table } from '@chakra-ui/react'
import { ZERO_ADDRESS } from '@vechain/sdk-core'
import { useState } from 'react'
import { NoTransfers } from '@/components/NoResults'
import { AmountWithHover } from '@/components/ui-legacy/AmountWithHover'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { BaseLink, TransactionLink } from '@/components/ui-legacy/Links'
import { Pagination } from '@/components/ui-legacy/Pagination'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { AddressString } from '@/lib/schemas'
import { isNotNullish } from '@/lib/type-predicates'
import { type Erc20, useErc20Contracts } from '@/services/thor/tokens/erc20'
import { useAccountTransfers } from '@/services/veworld-indexer/hooks'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'

const PAGE_SIZE = 30

export const AccountTransfersTab = ({ address }: { address: AddressString }) => {
  const [page, setPage] = useState(0)
  const { data: transfers, isLoading } = useAccountTransfers({
    params: { address, page, size: PAGE_SIZE },
  })

  const allTokenAddresses: AddressString[] =
    transfers?.data.map(transfer => transfer.tokenAddress).filter(isNotNullish) ?? []

  const { data: erc20Map, isPending: isPendingErc20List } = useErc20Contracts({
    contractAddressList: new Set<AddressString>(allTokenAddresses),
  })

  if (isLoading || isPendingErc20List) return <div>Loading...</div>
  if (!transfers || transfers.data.length === 0) return <NoTransfers />

  return (
    <Stack>
      <Table.ScrollArea borderWidth="1px" rounded="md">
        <Table.Root size="md" borderWidth="1px" rounded="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>Tx ID</Table.ColumnHeader>
              <Table.ColumnHeader>From</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
              <Table.ColumnHeader>To</Table.ColumnHeader>
              <Table.ColumnHeader>Amount</Table.ColumnHeader>
              <Table.ColumnHeader>Token</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <ErrorBoundary>
              {transfers.data.map(transfer => (
                <TransferRow
                  key={transfer.id}
                  transfer={transfer}
                  accountAddress={address}
                  token={erc20Map.get(transfer.tokenAddress ?? ZERO_ADDRESS)}
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
  const symbol = token?.symbol ?? '-'
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
