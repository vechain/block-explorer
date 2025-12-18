import { Box, Flex, Grid, ScrollArea, Skeleton, Text, useBreakpointValue } from '@chakra-ui/react'
import { useState } from 'react'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { type DecodedEvent, type DecodedEventArgs, type ParsedEvent, useDecodeEvent } from '@/hooks/useDecodeEvent'
import { EventType, type RawEvent } from '@/lib/schemas'
import type * as abi from '@/lib/schemas/abi'
import { AddressLink } from './ui/Links'
import { BorderedSurface, Surface } from './ui/Surface'
import { ValueSwitch } from './ui/ValueSwitch'
import { useTranslation } from 'react-i18next'

enum EventView {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const EventsList = ({ clauseIndex, eventLogs }: { clauseIndex: number; eventLogs: RawEvent[] }) => {
  return eventLogs.map((eventLog, index) => (
    <ErrorBoundary key={`${index}-${eventLog.address}`}>
      <EventCard layoutId={`event-${clauseIndex}-${index}`} index={index} eventLog={eventLog} />
    </ErrorBoundary>
  ))
}

const EventCard = ({ layoutId, index, eventLog }: { layoutId: string; index: number; eventLog: RawEvent }) => {
  const { t } = useTranslation()

  const { event, isLoading } = useDecodeEvent(eventLog)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const isDecoded = event.type === EventType.DECODED

  const [view, setView] = useState<string>(() => (isDecoded ? EventView.DECODED : EventView.RAW))

  if (isLoading) {
    return (
      <BorderedSurface>
        <Skeleton height="320px" width="100%" />
      </BorderedSurface>
    )
  }

  return (
    <Surface variant="secondary">
      <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <BorderedSurface display="flex" alignItems="center" gap="2" rounded="full" whiteSpace="nowrap">
          <Text># {index}</Text>
          <Text>{t('emitter')}</Text>
          <AddressLink address={event.raw.address} truncate={isMobile} />
        </BorderedSurface>
        <ValueSwitch
          layoutId={layoutId}
          bg="bg-secondary"
          values={[EventView.RAW, EventView.DECODED]}
          activeValue={view}
          onChange={setView}
          mt={{ base: '4', md: '0' }}
        />
      </Flex>
      <EventViews event={event} activeView={view as EventView} />
    </Surface>
  )
}

const EventViews = ({ event, activeView }: { event: ParsedEvent; activeView: EventView }) => {
  if (activeView === EventView.DECODED) {
    return <DecodedEventCard event={event.type === EventType.DECODED ? event.decoded : undefined} />
  }

  return <RawEventCard event={event.raw} />
}

const RawEventCard = ({ event }: { event: RawEvent }) => {
  const firstColumnWidth = '140px'
  const { t } = useTranslation()

  return (
    <ScrollArea.Root size="sm" variant="hover">
      <ScrollArea.Viewport borderWidth="1px" borderColor="border-primary" borderRadius="md">
        <ScrollArea.Content>
          <Grid
            templateColumns={`${firstColumnWidth} 30px 1fr`}
            p="4"
            borderBottomWidth="1px"
            borderColor="border-primary"
          >
            {event.topics.map((topic, index) => (
              <>
                {index === 0 ? <Text>{t('Topic')}</Text> : <br />}
                <Text>[{index}]</Text>
                <Text>{topic}</Text>
              </>
            ))}
          </Grid>

          <Grid templateColumns={`${firstColumnWidth} 1fr`} p="4">
            <Text>{t('Data')}</Text>
            <Text>{event.data}</Text>
          </Grid>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="horizontal" />
    </ScrollArea.Root>
  )
}

const DecodedEventCard = ({ event }: { event: DecodedEvent | undefined }) => {
  const { t } = useTranslation()

  if (!event) {
    return (
      <BorderedSurface>
        <Text>{t('No ABI found')}</Text>
      </BorderedSurface>
    )
  }

  return (
    <BorderedSurface>
      <Text textStyle="bodyL">{event.signature.split('(')[0]}</Text>
      <DecodedEventArgsTable inputs={event.inputs} args={event.args} />
    </BorderedSurface>
  )
}

const DecodedEventArgsTable = ({ inputs, args }: { inputs: abi.AbiEventParameter[]; args: DecodedEventArgs }) => {
  const { t } = useTranslation()

  return (
    <Box textAlign="center">
      <Grid templateColumns="60px 160px 160px 1fr" p="4">
        <Text>#</Text>
        <Text>{t('Name')}</Text>
        <Text>{t('Type')}</Text>
        <Text textAlign="left" pl="4">
          {t('Data')}
        </Text>
      </Grid>

      <Box borderWidth="1px" borderColor="border-primary" borderRadius="md" overflow="hidden">
        {inputs.map((input, index) => (
          <Grid
            key={`${index}-${input.name}`}
            templateColumns="60px 160px 160px 1fr"
            p="4"
            borderBottomWidth={index < inputs.length - 1 ? '1px' : '0'}
            borderColor="border-primary"
          >
            <Text>{index}</Text>
            <Text>{input.name}</Text>
            <Flex gap="1">
              <Text>{input.type}</Text>
              {input.indexed && <Text fontSize="xs">{t('indexed')}</Text>}
            </Flex>

            <Text textAlign="left" pl="4">
              {input.name ? args[input.name] : 'N/A'}
            </Text>
          </Grid>
        ))}
      </Box>
    </Box>
  )
}
