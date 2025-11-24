'use client'

import { Badge, Flex, Group, Heading, Stack, Table, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { LuCalendar, LuLink, LuSquareStack } from 'react-icons/lu'
import { SearchBar } from '@/components/navigation/SearchBar'
import { DataCard } from '@/components/ui/DataCard'
import { IDChip } from '@/components/ui/IDChip'
import { AddressLink } from '@/components/ui/Links'
import { Surface } from '@/components/ui/Surface'
import { type BlockId, blockIdSchema } from '@/lib/schemas'
import { useBlock } from '@/services/thor/hooks'
import { BlockInsight } from '../components/BlockInsights'

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

  const formattedDate = format(new Date(block.timestamp), 'dd/MM/yyyy')
  const formattedTime = format(new Date(block.timestamp), 'HH:mm:ss')

  return (
    <Stack gap="8">
      <SearchBar mt="16" />

      <Surface>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            Block Details
          </Heading>
          <IDChip value={block.id} />
        </Flex>

        <Flex alignItems="center" gap={{ base: '4', md: '5' }} flexDirection={{ base: 'column', md: 'row' }}>
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

        <BlockInsight block={block} />
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
