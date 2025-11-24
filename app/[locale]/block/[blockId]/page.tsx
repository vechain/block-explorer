'use client'

import { Badge, Flex, Group, Heading, Stack, Table, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { LuCalendar, LuLink, LuSquareStack } from 'react-icons/lu'
import { GasUsed } from '@/components/GasUsed'
import { SearchBar } from '@/components/navigation/SearchBar'
import { Size } from '@/components/Size'
import { DataCard } from '@/components/ui/DataCard'
import { AddressLink } from '@/components/ui/Links'
import { Surface } from '@/components/ui/Surface'
import { CopyableText } from '@/components/ui-legacy/CopyToClipBoard'
import { BlockLink, BlockTransactionsLink } from '@/components/ui-legacy/Links'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
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
  const { data: block, isPending } = useBlock(blockId)

  if (isPending) return <div>Loading...</div>

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

  const formattedDate = format(new Date(block.timestamp), 'dd/MM/yyyy')
  const formattedTime = format(new Date(block.timestamp), 'HH:mm:ss')

  return (
    <Stack gap="8">
      <SearchBar mt="16" />

      <Surface>
        <Heading as="h2" textStyle="displayXs">
          Block Details
        </Heading>

        <Flex alignItems="center" gap="5" flexDirection={{ base: 'column', md: 'row' }}>
          {/* Date and time */}
          <DataCard icon={<LuCalendar />} title="Date time" tooltip="Information coming soon">
            <Group gap="1">
              <Text textStyle="bodyL">{formattedDate}</Text>
              <Text textStyle="bodyL" color="text-secondary">
                {formattedTime}
              </Text>
            </Group>
          </DataCard>

          {/* Clauses count */}
          <DataCard icon={<LuSquareStack />} title="Total Clauses" tooltip="Information coming soon">
            <Text>{block.transactions.reduce((acc, tx) => acc + tx.clauses.length, 0)}</Text>
          </DataCard>

          {/* Block signer */}
          <DataCard icon={<LuLink />} title="Block Signer" tooltip="Information coming soon">
            <AddressLink address={block.signer} truncate />
          </DataCard>

          {/* Beneficiary */}
          <DataCard icon={<LuLink />} title="Beneficiary" tooltip="Information coming soon">
            <AddressLink address={block.beneficiary} truncate />
          </DataCard>
        </Flex>

      </Surface>

      <Surface>
        <Heading as="h2" textStyle="displayXs">
          Transactions
        </Heading>
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
      </Surface>
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
