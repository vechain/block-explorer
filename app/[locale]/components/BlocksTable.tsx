import { Text } from '@chakra-ui/react'
import Image from 'next/image'
import { AgeText } from '@/components/ui/AgeText'
import { BaseLink, CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable } from '@/components/ui/Table'
import type { CompressedBlock } from '@/lib/schemas'

export const BlocksTable = ({ blocks }: { blocks: CompressedBlock[] }) => {
  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'age', label: 'Age', Cell: ({ value }) => <AgeText timestamp={value as number} /> },
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

const GasUsedCell = ({ gasUsed, isFinalized }: { gasUsed: string; isFinalized: boolean }) => {
  return (
    <Text color="text-secondary" display="flex" alignItems="center" gap={3}>
      {gasUsed.toLocaleString()}
      {isFinalized ? (
        <Image src="/icons/success.svg" alt="Finalized" width={16} height={16} />
      ) : (
        <Image src="/icons/pending.svg" style={{ stroke: 'red' }} alt="Pending" width={16} height={16} />
      )}
    </Text>
  )
}
