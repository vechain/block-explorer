import { Text } from '@chakra-ui/react'
import { CiCircleCheck } from 'react-icons/ci'
import { PiClockCountdown } from 'react-icons/pi'
import { BaseLink, CopyableAddressLink } from '@/components/ui/Links'
import { AgeCell, type Column, DataTable } from '@/components/ui/Table'
import type { ExpandedBlockDetail } from '@/lib/schemas'

export const LatestBlocksTable = ({ blocks }: { blocks: ExpandedBlockDetail[] }) => {
  return <BlocksTable blocks={blocks} />
}

const BlocksTable = ({ blocks }: { blocks: ExpandedBlockDetail[] }) => {
  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'age', label: 'Age', Cell: AgeCell },
    {
      key: 'blockNumber',
      label: 'ID',
      Cell: ({ row }) => <BaseLink href={`/block/${row.id}`}>{row.blockNumber}</BaseLink>,
    },
    {
      key: 'signer',
      label: 'Signer',
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.signer} />,
    },
    { key: 'txs', label: 'Txs' },
    {
      key: 'gasUsed',
      label: 'Gas Used',
      Cell: ({ row }) => <GasUsedCell gasUsed={row.gasUsed} isFinalized={row.isFinalized} />,
    },
  ]

  const rows = blocks.map(block => ({
    id: block.id,
    blockNumber: `#${block.number.toString()}`,
    age: block.timestamp,
    block: block.number.toLocaleString(),
    signer: block.signer,
    txs: block.transactions.length,
    gasUsed: block.gasUsed.toLocaleString(),
    isFinalized: block.isFinalized,
  }))

  return <DataTable columns={columns} rows={rows} />
}

export const GasUsedCell = ({ gasUsed, isFinalized }: { gasUsed: string; isFinalized: boolean }) => {
  return (
    <Text color="text-secondary" display="flex" alignItems="center" gap={3}>
      {gasUsed.toLocaleString()}
      {isFinalized ? (
        <CiCircleCheck size={16} color="var(--chakra-colors-success-surface)" />
      ) : (
        <PiClockCountdown size={16} color="var(--chakra-colors-pending-text)" />
      )}
    </Text>
  )
}
