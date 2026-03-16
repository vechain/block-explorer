'use client'

import { useTranslation } from 'react-i18next'
import { AgeText } from '@/components/ui/AgeText'
import { CopyableAddressLink, CopyableLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import type { ExpandedBlock } from '@/lib/schemas'
import { useFormatNumber } from '@/hooks/useFormatting'

export const BlocksTable = ({ blocks }: { blocks: ExpandedBlock[] }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

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
    {
      key: 'signer',
      label: t('Signer'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.signer} />,
    },
  ]

  const rows = blocks.map(block => ({
    id: block.id,
    blockNumber: `#${block.number.toString()}`,
    blockNumberRaw: block.number.toString(),
    age: block.timestamp,
    block: formatNumber(block.number),
    signer: block.signer,
  }))

  return <DataTable columns={columns} rows={rows} />
}
