'use client'

import { Stack, Text } from '@chakra-ui/react'
import { formatEther } from 'viem'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableLink } from '@/components/ui/Links'
import { ValidatorLink } from '@/components/ui/ValidatorLink'
import { type Column, DataTable } from '@/components/ui/Table'
import { useFormatCurrency, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { Balance } from '@/components/ui/Balance'
import type { IndexerBlock } from '@/services/veworld-indexer/schemas'

type BlocksTableProps = { blocks: IndexerBlock[]; showDetails?: boolean }

export const BlocksTable = ({ blocks, showDetails = false }: BlocksTableProps) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatCurrencyValue = useFormatCurrency()
  const { price: vthoPrice } = useTokenDailyPrices('vethor-token')

  const rows = blocks.map(block => ({
    id: block.id,
    blockNumber: `#${block.number.toString()}`,
    blockNumberRaw: block.number.toString(),
    age: block.timestamp,
    block: formatNumber(block.number),
    signer: block.signer,
    txsClauses: `${block.transactions.length}/${block.clauseCount}`,
    gasUsed: formatNumber(Number(block.gasUsed)),
    vthoPaid: block.totalVthoPaid,
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
          { key: 'txsClauses', label: t('Txs/Clauses') },
          { key: 'gasUsed', label: t('Gas Used') },
          {
            key: 'vthoPaid',
            label: t('Transaction fees'),
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
      label: t('Validator'),
      Cell: ({ row }) => <ValidatorLink truncate address={row.signer} />,
    },
  ]

  return <DataTable columns={columns} rows={rows} />
}
