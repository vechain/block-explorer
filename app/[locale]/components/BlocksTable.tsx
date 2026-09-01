'use client'

import { Stack, Text } from '@chakra-ui/react'
import { formatEther } from 'viem'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import type { CompressedBlock, ExpandedBlock } from '@/lib/schemas'
import { useFormatCurrency, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { Balance } from '@/components/ui/Balance'

type BlocksTableProps =
  { blocks: CompressedBlock[]; showDetails?: false } | { blocks: ExpandedBlock[]; showDetails: true }

const isExpandedTransactions = (
  txs: ExpandedBlock['transactions'] | CompressedBlock['transactions'],
): txs is ExpandedBlock['transactions'] => txs.length === 0 || typeof txs[0] !== 'string'

export const BlocksTable = ({ blocks, showDetails = false }: BlocksTableProps) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatCurrencyValue = useFormatCurrency()
  const { price: vthoPrice } = useTokenDailyPrices('vethor-token')

  const rows = blocks.map(block => {
    const txCount = block.transactions.length
    const totalClauses = isExpandedTransactions(block.transactions)
      ? block.transactions.reduce((sum, tx) => sum + tx.clauses.length, 0)
      : 0
    const totalVthoPaid = isExpandedTransactions(block.transactions)
      ? block.transactions.reduce((sum, tx) => sum + tx.paid, BigInt(0))
      : 0n
    return {
      id: block.id,
      blockNumber: `#${block.number.toString()}`,
      blockNumberRaw: block.number.toString(),
      age: block.timestamp,
      block: formatNumber(block.number),
      signer: block.signer,
      txsClauses: `${txCount}/${totalClauses}`,
      gasUsed: formatNumber(Number(block.gasUsed)),
      vthoPaid: totalVthoPaid,
    }
  })

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
          { key: 'txsClauses', label: t('Txs/Clauses') },
          { key: 'gasUsed', label: t('Gas Used') },
          {
            key: 'vthoPaid',
            label: t('VTHO Paid'),
            Cell: ({ row }) => {
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
