'use client'

import { Flex, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink } from '@/components/ui/Links'
import { type CellComponentProps, type Column, DataTable } from '@/components/ui/Table'
import { AmountWithHover } from '@/components/ui-legacy/AmountWithHover'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'
import { useErc20Contracts } from '@/services/thor/tokens/erc20'
import { isNotNullish } from '@/lib/type-predicates'

export const TokenTransfersTable = ({ transfers }: { transfers: IndexerTransfer[] }) => {
  const { t } = useTranslation()

  const allTokenAddresses = useMemo(
    () => transfers.map(transfer => transfer.tokenAddress).filter(isNotNullish),
    [transfers],
  )

  const { data: erc20Map } = useErc20Contracts({
    contractAddressList: useMemo(() => new Set(allTokenAddresses), [allTokenAddresses]),
  })

  const transferMap = useMemo(() => {
    const map = new Map<string, IndexerTransfer>()
    transfers.forEach(transfer => map.set(transfer.id, transfer))
    return map
  }, [transfers])

  const AmountCell = useMemo(() => {
    const CellComponent = (props: CellComponentProps) => {
      const transfer = transferMap.get(props.row.id)
      if (!transfer) return null

      const token = transfer.tokenAddress ? erc20Map?.get(transfer.tokenAddress) : null
      const decimals = token?.decimals ?? 18
      const tokenSymbol = token?.symbol ?? (transfer.tokenAddress ? '-' : 'VET')

      return (
        <Flex alignItems="center" gap={1}>
          <AmountWithHover amount={transfer.value} decimals={decimals} />
          {tokenSymbol && (
            <Text color="text-secondary" fontSize="sm">
              {tokenSymbol}
            </Text>
          )}
        </Flex>
      )
    }
    CellComponent.displayName = 'AmountCell'
    return CellComponent
  }, [transferMap, erc20Map])

  const rows = useMemo(
    () =>
      transfers.map(transfer => ({
        id: transfer.id,
        age: transfer.blockTimestamp,
        from: transfer.from,
        to: transfer.to,
        amount: '',
      })),
    [transfers],
  )

  const columnsMemo = useMemo(
    () =>
      [
        { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
        {
          key: 'from',
          label: t('From'),
          Cell: ({ value }) => <CopyableAddressLink truncate address={value as `0x${string}`} />,
        },
        {
          key: 'to',
          label: t('To'),
          Cell: ({ value }) => <CopyableAddressLink truncate address={value as `0x${string}`} />,
        },
        {
          key: 'amount',
          label: t('Amount'),
          Cell: AmountCell,
        },
      ] as Column<(typeof rows)[number]>[],
    [t, AmountCell],
  )

  return <DataTable columns={columnsMemo} rows={rows} />
}
