import { Box, Flex, Grid, HStack, ScrollArea, Skeleton, Text, useBreakpointValue } from '@chakra-ui/react'
import { Fragment, useState } from 'react'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { type DecodedEvent, useDecodeEvent } from '@/hooks/useDecodeEvent'
import { EventType, type RawEvent } from '@/lib/schemas'
import { AddressLink } from './ui/Links'
import { Card } from './ui/Card'
import { ValueSwitch } from './ui/ValueSwitch'
import { useTranslation } from 'react-i18next'

enum EventView {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const EventsList = ({ clauseIndex, eventLogs }: { clauseIndex: number; eventLogs: RawEvent[] }) => {
  const { t } = useTranslation()

  if (eventLogs.length === 0) {
    return (
      <Card variant="outline">
        <Text>{t('No events')}</Text>
      </Card>
    )
  }

  return eventLogs.map((eventLog, index) => (
    <ErrorBoundary key={`${index}-${eventLog.address}`}>
      <EventCard layoutId={`event-${clauseIndex}-${index}`} index={index} eventLog={eventLog} />
    </ErrorBoundary>
  ))
}

const EventCard = ({ layoutId, index, eventLog }: { layoutId: string; index: number; eventLog: RawEvent }) => {
  const { t } = useTranslation()

  const { event, isPending } = useDecodeEvent(eventLog)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const isDecoded = event.type === EventType.DECODED

  const [view, setView] = useState<string>(() => (isDecoded ? EventView.DECODED : EventView.RAW))

  if (isPending) {
    return (
      <Card variant="tertiary">
        <Skeleton height="320px" width="100%" />
      </Card>
    )
  }

  return (
    <Card variant="tertiary">
      <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Card
          variant="outline"
          flexDirection="row"
          display="flex"
          alignItems="center"
          gap="5"
          rounded="full"
          whiteSpace="nowrap"
          py="2"
          px="4"
        >
          <Text>#{index}</Text>
          <HStack gap="2">
            <Text>{t('emitter')}</Text>
            <AddressLink address={event.raw.address} truncate={isMobile} />
          </HStack>
        </Card>
        <ValueSwitch
          layoutId={layoutId}
          bg="bg-outline"
          values={[EventView.RAW, EventView.DECODED]}
          activeValue={view}
          onChange={setView}
          mt={{ base: '4', md: '0' }}
        />
      </Flex>

      {view === EventView.DECODED ? (
        <DecodedEventCard event={event.type === EventType.DECODED ? event.decoded : undefined} />
      ) : (
        <RawEventCard event={event.raw} />
      )}
    </Card>
  )
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
              <Fragment key={index}>
                {index === 0 ? <Text>{t('Topic')}</Text> : <br />}
                <Text>[{index}]</Text>
                <Text>{topic}</Text>
              </Fragment>
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
      <Card variant="outline">
        <Text>{t('No ABI found')}</Text>
      </Card>
    )
  }

  return (
    <Card variant="outline">
      <Text textStyle="bodyL">{event.signature.split('(')[0]}</Text>
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
          {event.inputs.map((input, index) => (
            <Grid
              key={`${index}-${input.name}`}
              templateColumns="60px 160px 160px 1fr"
              p="4"
              borderBottomWidth={index < event.inputs.length - 1 ? '1px' : '0'}
              borderColor="border-primary"
            >
              <Text>{index}</Text>
              <Text>{input.name}</Text>
              <Flex gap="1">
                <Text>{input.type}</Text>
                {input.indexed && <Text fontSize="xs">{t('indexed')}</Text>}
              </Flex>

              <Text textAlign="left" pl="4">
                {input.name ? event.args[input.name] : 'N/A'}
              </Text>
            </Grid>
          ))}
        </Box>
      </Box>
    </Card>
  )
}
