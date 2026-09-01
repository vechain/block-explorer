'use client'

import { Skeleton, Stack, Text } from '@chakra-ui/react'
import { formatEther } from 'viem'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import { useFormatCurrency, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { Balance } from '@/components/ui/Balance'
import type { BlockWithDetails } from '@/services/veworld-indexer/latest-blocks'

type BlocksTableProps = { blocks: BlockWithDetails[]; showDetails?: boolean }

export const BlocksTable = ({ blocks, showDetails = false }: BlocksTableProps) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatCurrencyValue = useFormatCurrency()
  const { price: vthoPrice } = useTokenDailyPrices('vethor-token')

  const rows = blocks.map(({ clauseCount, vthoPaid, ...block }) => ({
    id: block.id,
    blockNumber: `#${block.number.toString()}`,
    blockNumberRaw: block.number.toString(),
    age: block.timestamp,
    block: formatNumber(block.number),
    signer: block.signer,
    detailsPending: clauseCount === undefined,
    txsClauses: `${block.transactions.length}/${clauseCount ?? 0}`,
    gasUsed: formatNumber(Number(block.gasUsed)),
    vthoPaid: vthoPaid ?? 0n,
  }))

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'blockNumber',
      label: t('Block'),
      Cell: ({ row }) => (
        <CopyableLink href={`/block/${row.id}`} value={row.blockNumberRaw}>
          {row.blockNumber}
        </CopyableLink>
      ),
    },
    { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
    ...(showDetails
      ? ([
          {
            key: 'txsClauses',
            label: t('Txs/Clauses'),
            Cell: ({ row }) =>
              row.detailsPending ? <Skeleton height="5" width="12" /> : <Text>{row.txsClauses}</Text>,
          },
          { key: 'gasUsed', label: t('Gas Used') },
          {
            key: 'vthoPaid',
            label: t('VTHO Paid'),
            Cell: ({ row }) => {
              if (row.detailsPending) return <Skeleton height="5" width="20" />
              const fiatValue = vthoPrice ? Number(formatEther(row.vthoPaid)) * vthoPrice : undefined
              return (
                <Stack gap={0}>
                  <Balance balance={row.vthoPaid} />
                  {fiatValue !== undefined && (
                    <Text textStyle="bodyS" color="text-secondary">
                      {formatCurrencyValue(fiatValue)}
                    </Text>
                  )}
                </Stack>
              )
            },
          },
        ] as Column<(typeof rows)[number]>[])
      : []),
    {
      key: 'signer',
      label: t('Signer'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.signer} />,
    },
  ]

  return <DataTable columns={columns} rows={rows} />
}
