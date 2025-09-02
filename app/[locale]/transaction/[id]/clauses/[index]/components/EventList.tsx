import { Badge, Card, Code as ChakraCode, DataList, Flex, List, Stack, Switch, Table, Text } from '@chakra-ui/react'
import type { Event } from '@vechain/sdk-network'
import { useEffect, useState } from 'react'
import { Code } from '@/components/ui/Code'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import { useDecodeEvent } from '@/hooks/useDecodeEvent'
import { addressStringSchema } from '@/lib/schemas'
import type * as abi from '@/lib/schemas/abi'
import { type DecodedEvent, type DecodedEventArgs, EventType } from '@/lib/schemas/events'

export const EventList = ({ eventLogs }: { eventLogs: Event[] }) => {
  return (
    <Stack gap={2}>
      {eventLogs.map((eventLog, i) => (
        <ErrorBoundary key={`${i}-${eventLog.address}`}>
          <EventCard eventLog={eventLog} />
        </ErrorBoundary>
      ))}
    </Stack>
  )
}

const EventCard = ({ eventLog }: { eventLog: Event }) => {
  const { event, isLoading } = useDecodeEvent(eventLog)

  const [showDecoded, setShowDecoded] = useState(true)

  useEffect(() => {
    setShowDecoded(event.type === EventType.DECODED)
  }, [event.type])

  if (isLoading) {
    return <div>Loading...</div>
  }

  const isDecoded = event.type === EventType.DECODED

  return (
    <Card.Root size="sm">
      <Card.Header>
        <Flex justifyContent="flex-end">
          {isDecoded ? (
            <Switch.Root checked={showDecoded} onCheckedChange={details => setShowDecoded(details.checked)}>
              <Switch.Label>Decode</Switch.Label>
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              No ABI found
            </Text>
          )}
        </Flex>
      </Card.Header>

      {showDecoded && isDecoded ? <DecodedEventCard event={event.decoded} /> : <RawEventCard event={event.raw} />}
    </Card.Root>
  )
}

const RawEventCard = ({ event }: { event: Event }) => {
  return (
    <Card.Body color="fg.muted">
      <DataList.Root orientation="horizontal">
        <DataList.Item>
          <DataList.ItemLabel fontWeight="bold">Address</DataList.ItemLabel>
          <DataList.ItemValue>
            <VnsBadgeOrAddressLink address={addressStringSchema.parse(event.address)} />
          </DataList.ItemValue>
        </DataList.Item>

        <DataList.Item alignItems="flex-start">
          <DataList.ItemLabel fontWeight="bold">Topics</DataList.ItemLabel>
          <DataList.ItemValue>
            <List.Root as="ol" listStylePosition="inside">
              {event.topics.map((topic, i) => (
                <List.Item key={i + topic} whiteSpace="nowrap">
                  {topic}
                </List.Item>
              ))}
            </List.Root>
          </DataList.ItemValue>
        </DataList.Item>

        <DataList.Item alignItems="flex-start">
          <DataList.ItemLabel fontWeight="bold">Data</DataList.ItemLabel>
          <DataList.ItemValue>
            <Code>{event.data}</Code>
          </DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
    </Card.Body>
  )
}

const DecodedEventCard = ({ event }: { event: DecodedEvent }) => {
  return (
    <Card.Body color="fg.muted">
      <Stack gap={2}>
        <DataList.Root orientation="horizontal">
          <DataList.Item>
            <DataList.ItemLabel fontWeight="bold">Address</DataList.ItemLabel>
            <DataList.ItemValue>
              <VnsBadgeOrAddressLink address={event.address} />
            </DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel fontWeight="bold">Name</DataList.ItemLabel>
            <DataList.ItemValue>
              <Text fontWeight="bold">{event.signature}</Text>
            </DataList.ItemValue>
          </DataList.Item>
        </DataList.Root>

        <DecodedEventArgsTable inputs={event.inputs} args={event.args} />
      </Stack>
    </Card.Body>
  )
}

const DecodedEventArgsTable = ({ inputs, args }: { inputs: abi.AbiEventParameter[]; args: DecodedEventArgs }) => {
  return (
    <Table.Root size="sm">
      <Table.Body>
        {inputs.map((input, i) => (
          <Table.Row key={`${i}-${input.name}`}>
            <Table.Cell>
              <ChakraCode color="fg.info">{input.name}</ChakraCode>
            </Table.Cell>
            <Table.Cell>
              <Text fontSize="xs" fontStyle="italic">
                {input.type}
              </Text>
              {input.indexed && (
                <Badge colorPalette="cyan" size="xs">
                  Indexed
                </Badge>
              )}
            </Table.Cell>
            <Table.Cell flex={1}>
              <Code w="100%" whiteSpace="normal" wordBreak="break-all">
                {input.name ? args[input.name] : 'N/A'}
              </Code>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
