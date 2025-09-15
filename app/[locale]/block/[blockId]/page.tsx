'use client'

import { Badge, Flex, Stack, Table } from '@chakra-ui/react'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { GasUsed } from '@/components/GasUsed'
import { Size } from '@/components/Size'
import { CopyableText, CopyToClipBoard } from '@/components/ui/CopyToClipBoard'
import { BlockLink, BlockTransactionsLink } from '@/components/ui/Links'
import { Subtitle, Title } from '@/components/ui/Typography'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import { type BlockId, blockIdSchema } from '@/lib/schemas'
import { formatDateFromTimestamp } from '@/lib/utils/date'
import { formatHexToGwei } from '@/lib/utils/units'
import { useBlock } from '@/services/thor/hooks'

export default function BlockPage({ params }: { params: Promise<{ blockId: BlockId }> }) {
  const { blockId } = use(params)

  if (!blockId || !blockIdSchema.safeParse(blockId).success) {
    notFound()
  }

  return <BlockDetails blockId={blockId} />
}

const BlockDetails = ({ blockId }: { blockId: BlockId }) => {
  const { data: block, isLoading } = useBlock(blockId)

  if (isLoading) return <div>Loading...</div>

  if (!block) {
    notFound()
  }

  const items = [
    { name: 'Number', value: `# ${block.number.toLocaleString()}` },
    { name: 'ID', value: <CopyableText value={block.id} /> },
    { name: 'Parent ID', value: <BlockLink blockId={block.parentID}>{block.parentID}</BlockLink> },
    { name: 'Timestamp', value: formatDateFromTimestamp(block.timestamp) },
    { name: 'Size', value: <Size size={block.size} /> },
    {
      name: 'Finalized',
      value: (
        <Badge variant="surface" colorPalette={block.isFinalized ? 'green' : 'yellow'} size="sm">
          {block.isFinalized ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      name: 'Transactions',
      value: <BlockTransactionsLink blockId={block.id}>{block.transactions.length} Transactions</BlockTransactionsLink>,
    },
    { name: 'Transactions Features', value: <TxFeatures features={block.txsFeatures} /> },
    { name: 'Gas Used', value: <GasUsed gasUsed={block.gasUsed} gasLimit={block.gasLimit} /> },
    {
      name: 'Base Fee Per Gas',
      value: block.baseFeePerGas ? `${formatHexToGwei(block.baseFeePerGas)} Gwei` : '-',
    },
    { name: 'Signer', value: <VnsBadgeOrAddressLink address={block.signer} /> },
    { name: 'Beneficiary', value: <VnsBadgeOrAddressLink address={block.beneficiary} /> },
    { name: 'Transactions Root', value: block.txsRoot },
    { name: 'State Root', value: block.stateRoot },
    { name: 'Receipts Root', value: block.receiptsRoot },
    { name: 'Total Score', value: block.totalScore.toLocaleString() },
    { name: 'Is Trunk', value: block.isTrunk ? 'Yes' : 'No' },
    { name: 'Com', value: block.com ? 'Yes' : 'No' },
  ]

  return (
    <Stack>
      <Title>Block</Title>

      <Flex alignItems="center" gap={2}>
        <Subtitle># {block.number.toLocaleString()}</Subtitle>
        <CopyToClipBoard value={block.number.toLocaleString()} />
      </Flex>

      <Table.ScrollArea my={12} borderWidth="1px" rounded="md">
        <Table.Root size="md">
          <Table.Body>
            {items.map(item => (
              <Table.Row key={item.name}>
                <Table.Cell>{item.name}</Table.Cell>
                <Table.Cell>{item.value}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  )
}

const TxFeatures = ({ features }: { features: number | undefined }) => {
  if (features === 1) {
    return (
      <Badge variant="surface" size="sm">
        VIP-191 - Fee delegation
      </Badge>
    )
  }

  return null
}
