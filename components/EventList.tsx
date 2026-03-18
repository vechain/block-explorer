import { Box, Flex, Grid, HStack, ScrollArea, Skeleton, Text, useBreakpointValue, VStack } from '@chakra-ui/react'
import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { type DecodedEvent, useDecodeEvent } from '@/hooks/useDecodeEvent'
import { EventType, type RawEvent } from '@/lib/schemas'
import { CopyableAddressLink } from './ui/Links'
import { Card } from './ui/Card'
import { ToggleGroup, type ToggleOption } from './ui/ToggleGroup'

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

  const [view, setView] = useState<EventType>(() => (isDecoded ? EventType.DECODED : EventType.RAW))

  const viewOptions: ToggleOption<EventType>[] = useMemo(
    () => [
      { value: EventType.RAW, label: t('Raw') },
      { value: EventType.DECODED, label: t('Decoded') },
    ],
    [t],
  )

  if (isPending) {
    return (
      <Card variant="tertiary">
        <Skeleton height="320px" width="100%" />
      </Card>
    )
  }

  return (
    <Card variant="tertiary" overflow="hidden">
      <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="2">
        <Card
          variant="outline"
          flexDirection="row"
          display="flex"
          alignItems="center"
          gap={{ base: '2', md: '5' }}
          rounded="full"
          whiteSpace="nowrap"
          p={0}
          py={2}
          px={{ base: 2, md: 4 }}
          maxW="100%"
        >
          <Text>#{index}</Text>
          <HStack gap="2" overflow="hidden">
            <Text>{t('emitter')}</Text>
            <CopyableAddressLink address={event.raw.address} truncate={isMobile} />
          </HStack>
        </Card>
        <Flex>
          <ToggleGroup
            layoutId={layoutId}
            options={viewOptions}
            value={view}
            onChange={setView}
            mt={{ base: '4', md: '0' }}
            size="sm"
          />
        </Flex>
      </Flex>

      {view === EventType.DECODED ? (
        <DecodedEventCard event={event.type === EventType.DECODED ? event.decoded : undefined} />
      ) : (
        <RawEventCard event={event.raw} />
      )}
    </Card>
  )
}

const RawEventCard = ({ event }: { event: RawEvent }) => {
  const firstColumnWidth = '100px'
  const { t } = useTranslation()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Mobile: Stack layout with cards
  if (isMobile) {
    return (
      <Box borderWidth="1px" borderColor="border-primary" borderRadius="md" overflow="hidden">
        {event.topics.map((topic, index) => (
          <Box key={index} p="3" borderBottomWidth="1px" borderColor="border-primary" _last={{ borderBottom: 'none' }}>
            <Text fontWeight="semibold" fontSize="sm" color="text-alt" mb="1">
              {t('Topic')} [{index}]
            </Text>
            <Text wordBreak="break-all" fontSize="sm">
              {topic}
            </Text>
          </Box>
        ))}
        <Box p="3" borderTopWidth="1px" borderColor="border-primary">
          <Text fontWeight="semibold" fontSize="sm" color="text-alt" mb="1">
            {t('Data')}
          </Text>
          <Text wordBreak="break-all" fontSize="sm">
            {event.data}
          </Text>
        </Box>
      </Box>
    )
  }

  // Desktop: Grid layout with horizontal scroll
  return (
    <ScrollArea.Root size="sm" variant="hover">
      <ScrollArea.Viewport borderWidth="1px" borderColor="border-primary" borderRadius="md">
        <ScrollArea.Content>
          <Grid
            templateColumns={`${firstColumnWidth} 30px 1fr`}
            p="4"
            minW="400px"
            borderBottomWidth="1px"
            borderColor="border-primary"
          >
            {event.topics.map((topic, index) => (
              <Fragment key={index}>
                {index === 0 ? <Text>{t('Topic')}</Text> : <br />}
                <Text>[{index}]</Text>
                <Text wordBreak="break-all">{topic}</Text>
              </Fragment>
            ))}
          </Grid>

          <Grid templateColumns={`${firstColumnWidth} 1fr`} p="4" minW="400px">
            <Text>{t('Data')}</Text>
            <Text wordBreak="break-all">{event.data}</Text>
          </Grid>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="horizontal" />
    </ScrollArea.Root>
  )
}

const DecodedEventCard = ({ event }: { event: DecodedEvent | undefined }) => {
  const { t } = useTranslation()
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (!event) {
    return (
      <Card variant="outline">
        <Text>{t('No ABI found')}</Text>
      </Card>
    )
  }

  // Mobile: Stack layout with cards
  if (isMobile) {
    return (
      <VStack alignItems="stretch" gap="2">
        <Text textStyle="bodyL" mb="3" fontWeight="medium">
          {event.signature.split('(')[0]}
        </Text>
        <Box borderWidth="1px" borderColor="border-primary" borderRadius="md" overflow="hidden">
          {event.inputs.map((input, index) => (
            <Box
              key={`${index}-${input.name}`}
              p="3"
              borderBottomWidth={index < event.inputs.length - 1 ? '1px' : '0'}
              borderColor="border-primary"
            >
              <Flex justifyContent="space-between" alignItems="center" mb="2">
                <Text fontWeight="semibold" fontSize="sm">
                  #{index} {input.name}
                </Text>
                <Flex gap="1" alignItems="center">
                  <Text fontSize="xs" color="text-alt">
                    {input.type}
                  </Text>
                  {input.indexed && (
                    <Text fontSize="xs" color="accent-primary">
                      {t('indexed')}
                    </Text>
                  )}
                </Flex>
              </Flex>
              <Text wordBreak="break-all" fontSize="sm">
                {input.name ? event.args[input.name] : 'N/A'}
              </Text>
            </Box>
          ))}
        </Box>
      </VStack>
    )
  }

  // Desktop: Grid layout with horizontal scroll
  return (
    <VStack alignItems="stretch" gap="2">
      <Text textStyle="bodyL" fontWeight="medium">
        {event.signature.split('(')[0]}
      </Text>
      <ScrollArea.Root size="sm" variant="hover">
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <Box textAlign="center" minW="fit-content">
              <Grid templateColumns="60px 160px 160px 1fr" p="4" minW="500px">
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
                    minW="500px"
                    borderBottomWidth={index < event.inputs.length - 1 ? '1px' : '0'}
                    borderColor="border-primary"
                  >
                    <Text>{index}</Text>
                    <Text>{input.name}</Text>
                    <Flex gap="1">
                      <Text>{input.type}</Text>
                      {input.indexed && <Text fontSize="xs">{t('indexed')}</Text>}
                    </Flex>

                    <Text textAlign="left" pl="4" minW="0">
                      {input.name ? event.args[input.name] : 'N/A'}
                    </Text>
                  </Grid>
                ))}
              </Box>
            </Box>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" />
      </ScrollArea.Root>
    </VStack>
  )
}
