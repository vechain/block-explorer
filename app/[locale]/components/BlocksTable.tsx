'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { AppendIconCell, type CellComponentProps, type Column, DataTable } from '@/components/ui/Table'
import type { ExpandedBlock } from '@/lib/schemas'
import { useFormatNumber } from '@/hooks/useFormatting'

export const BlocksTable = ({ blocks }: { blocks: ExpandedBlock[] }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'age', label: t('Age'), Cell: ({ value }) => <AgeText timestamp={value as number} /> },
    {
      key: 'blockNumber',
      label: t('Block'),
      Cell: ({ row }) => (
        <CopyableLink href={`/block/${row.id}`} value={row.blockNumberRaw}>
          {row.blockNumber}
        </CopyableLink>
      ),
    },
    {
      key: 'signer',
      label: t('Signer'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.signer} />,
    },
    { key: 'txs/clauses', label: t('Txs/Clauses') },
    {
      key: 'gasUsed',
      label: t('Gas Used'),
      Cell: GasUsedCell,
    },
  ]

  const rows = blocks.map(block => {
    const totalClauses = block.transactions.reduce((sum, tx) => sum + tx.clauses.length, 0)
    return {
      id: block.id,
      blockNumber: `#${block.number.toString()}`,
      blockNumberRaw: block.number.toString(),
      age: block.timestamp,
      block: formatNumber(block.number),
      signer: block.signer,
      'txs/clauses': `${block.transactions.length}/${totalClauses}`,
      gasUsed: formatNumber(Number(block.gasUsed)),
      isFinalized: block.isFinalized,
    }
  })

  return <DataTable columns={columns} rows={rows} />
}

const GasUsedCell = (props: CellComponentProps) => {
  const icon = props.row.isFinalized ? (
    <Image src="/icons/success.svg" alt="Finalized" width={16} height={16} />
  ) : (
    <Image src="/icons/pending.svg" alt="Pending" width={16} height={16} />
  )

  return <AppendIconCell icon={icon} {...props} />
}
