import { Box, Flex, Skeleton, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import { useContractName } from '@/hooks/useContractName'
import { type DecodedEvent, useDecodeEvent } from '@/hooks/useDecodeEvent'
import { formatArgForDisplay } from '@/lib/abi-registry'
import { EventType, type HexString, type RawEvent } from '@/lib/schemas'
import { CopyableAddressLink } from './ui/Links'
import { ParamRows } from './InputData'
import { ToggleGroup, type ToggleOption } from './ui/ToggleGroup'

export const EventsList = ({
  clauseIndex,
  eventLogs,
  expert = false,
}: {
  clauseIndex: number
  eventLogs: RawEvent[]
  expert?: boolean
}) => {
  const { t } = useTranslation()

  if (eventLogs.length === 0) {
    return (
      <Box borderWidth="1px" borderColor="border-primary" rounded="md" px="4" py="6" textAlign="center">
        <Text textStyle="bodyS" color="text-secondary">
          {t('No events — this transaction emitted no logs.')}
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap="3">
      {eventLogs.map((eventLog, index) => (
        <ErrorBoundary key={`${index}-${eventLog.address}`}>
          <EventCard layoutId={`event-${clauseIndex}-${index}`} eventLog={eventLog} expert={expert} />
        </ErrorBoundary>
      ))}
    </Stack>
  )
}

const EventCard = ({ layoutId, eventLog, expert }: { layoutId: string; eventLog: RawEvent; expert: boolean }) => {
  const { t } = useTranslation()
  const { event, isPending } = useDecodeEvent(eventLog)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const { name: emitterName } = useContractName(eventLog.address)

  // Default to decoded; the "No ABI found" placeholder is shown in the
  // decoded pane when nothing resolves so the UI feels consistently verified.
  const [view, setView] = useState<EventType>(EventType.DECODED)

  const viewOptions: ToggleOption<EventType>[] = useMemo(
    () => [
      { value: EventType.RAW, label: t('Raw') },
      { value: EventType.DECODED, label: t('Decoded') },
    ],
    [t],
  )

  if (isPending) {
    return <EventCardSkeleton />
  }

  const effectiveView = expert ? view : EventType.DECODED
  const isDecoded = event.type === EventType.DECODED
  const decoded: DecodedEvent | undefined = isDecoded ? event.decoded : undefined
  const eventName = decoded?.name ?? null

  return (
    <Box
      borderWidth="1px"
      borderColor="border-primary"
      bg="bg-primary"
      rounded="xl"
      px="4"
      py="3"
      display="flex"
      flexDirection="column"
      gap="3"
    >
      <Flex justifyContent="space-between" alignItems="flex-start" gap="3" flexWrap="wrap">
        <Stack gap="0.5" minW="0">
          <Text fontFamily="mono" textStyle="bodyL" color="accent-primary" wordBreak="break-all">
            {eventName ?? t('Unknown event')}
          </Text>
          <Flex gap="2" alignItems="center" flexWrap="wrap" color="text-secondary">
            <Text textStyle="bodyS">{t('emitted by')}</Text>
            {emitterName && (
              <Text textStyle="bodyS" color="text-primary" fontWeight="medium">
                {emitterName}
              </Text>
            )}
            <CopyableAddressLink address={eventLog.address} truncate={true} fontSize="sm" />
          </Flex>
        </Stack>
        {expert && <ToggleGroup layoutId={layoutId} options={viewOptions} value={view} onChange={setView} size="sm" />}
      </Flex>

      {effectiveView === EventType.DECODED ? (
        <DecodedEventBody event={decoded} isMobile={!!isMobile} expert={expert} />
      ) : (
        <RawEventBody event={eventLog} />
      )}

      {expert && effectiveView === EventType.DECODED && (
        <RawTopicsAndData topics={eventLog.topics as HexString[]} data={eventLog.data} />
      )}
    </Box>
  )
}

// Mirrors the real event-card chrome (border + bg + same internal gaps)
// so loading doesn't visually collapse the row down to a single block.
// Two faux param rows feel right for the typical Transfer / approval
// event — enough to keep the height stable when content swaps in.
const EventCardSkeleton = () => {
  const rowDivider = 'rgba(255, 255, 255, 0.08)'
  return (
    <Box
      borderWidth="1px"
      borderColor="border-primary"
      bg="bg-primary"
      rounded="xl"
      px="4"
      py="3"
      display="flex"
      flexDirection="column"
      gap="3"
    >
      <Stack gap="2">
        <Skeleton height="20px" width="40%" rounded="sm" />
        <Skeleton height="14px" width="55%" rounded="sm" />
      </Stack>
      <Box>
        <Box
          display="grid"
          gridTemplateColumns="52px 180px minmax(0,1fr)"
          gap="3"
          pb="3"
          borderBottomWidth="1px"
          borderColor={rowDivider}
        >
          <Skeleton height="10px" width="12px" rounded="sm" />
          <Skeleton height="10px" width="40px" rounded="sm" />
          <Skeleton height="10px" width="40px" rounded="sm" />
        </Box>
        {[0, 1].map(row => (
          <Box
            key={row}
            display="grid"
            gridTemplateColumns="52px 180px minmax(0,1fr)"
            gap="3"
            py="4"
            borderTopWidth={row === 0 ? '0' : '1px'}
            borderColor={rowDivider}
            alignItems="center"
          >
            <Skeleton height="14px" width="16px" rounded="sm" />
            <Skeleton height="14px" width="70%" rounded="sm" />
            <Skeleton height="14px" width="85%" rounded="sm" />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const DecodedEventBody = ({
  event,
  isMobile,
  expert,
}: {
  event: DecodedEvent | undefined
  isMobile: boolean
  expert: boolean
}) => {
  const { t } = useTranslation()

  if (!event) {
    return (
      <Box borderWidth="1px" borderColor="border-primary" rounded="md" px="3" py="3">
        <Text textStyle="bodyS" color="text-secondary">
          {t('No ABI found')}
        </Text>
      </Box>
    )
  }

  if (event.inputs.length === 0) {
    return (
      <Text textStyle="bodyS" color="text-secondary">
        {t('No parameters.')}
      </Text>
    )
  }

  return (
    <ParamRows
      isMobile={isMobile}
      showType={expert}
      rows={event.inputs.map((input, index) => ({
        name: input.name ?? String(index),
        type: input.type,
        indexed: input.indexed ?? false,
        value: formatArgForDisplay(event.args[input.name || String(index)]) || 'N/A',
      }))}
    />
  )
}

const RawEventBody = ({ event }: { event: RawEvent }) => {
  return (
    <Stack gap="2">
      <RawTopicsAndData topics={event.topics as HexString[]} data={event.data} />
    </Stack>
  )
}

const RawTopicsAndData = ({ topics, data }: { topics: HexString[]; data: HexString }) => {
  const { t } = useTranslation()
  return (
    <Stack gap="2">
      <Box>
        <Text textStyle="bodyS" textTransform="uppercase" letterSpacing="wider" color="text-secondary" mb="1">
          {t('Topics')}
        </Text>
        <Stack gap="1">
          {topics.map((topic, index) => (
            <Box
              key={index}
              borderWidth="1px"
              borderColor="border-primary"
              bg="bg-primary"
              rounded="md"
              px="3"
              py="2"
              fontFamily="mono"
              fontSize="xs"
              color="text-secondary"
            >
              <Text wordBreak="break-all">
                [{index}] {topic}
              </Text>
            </Box>
          ))}
        </Stack>
      </Box>
      <Box>
        <Text textStyle="bodyS" textTransform="uppercase" letterSpacing="wider" color="text-secondary" mb="1">
          {t('Data')}
        </Text>
        <Box
          borderWidth="1px"
          borderColor="border-primary"
          bg="bg-primary"
          rounded="md"
          px="3"
          py="2"
          fontFamily="mono"
          fontSize="xs"
          color="text-secondary"
        >
          <Text wordBreak="break-all">{data}</Text>
        </Box>
      </Box>
    </Stack>
  )
}
