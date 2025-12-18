'use client'

import { Accordion, Box, Flex, Text, useBreakpointValue } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RawEvent } from '@/lib/schemas/events'
import type { Clause, Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { EventsList } from './EventList'
import { InputData } from './InputData'
import { VETBalance } from './ui/Balance'
import { CopyableAddressLink } from './ui/Links'
import { ValueSwitch } from './ui/ValueSwitch'

enum ClauseView {
  INPUT_DATA = 'input-data',
  EVENTS = 'events',
}

export function TransactionClauses({
  transaction,
  receipt,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
}) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  return (
    <Accordion.Root multiple rounded="md" overflow="hidden" borderWidth="1px" borderColor="border-primary">
      {transaction.clauses.map((clause, index) => (
        <Accordion.Item
          key={index.toString()}
          value={index.toString()}
          px="4"
          py="5"
          border="none"
          bg={index % 2 === 0 ? 'row-even-bg-primary' : 'row-odd-bg-primary'}
        >
          <Flex>
            <Accordion.ItemTrigger p="0" justifyContent="space-between" cursor="pointer">
              <Flex alignItems="center" gap={{ base: '2', md: '5' }}>
                <Text textStyle="bodyM">{(index + 1).toString()}</Text>
                <ClauseTypeBadge />
              </Flex>
            </Accordion.ItemTrigger>
            <CopyableAddressLink truncate={isMobile} address={clause.to ?? '0x'} />
            <Accordion.ItemTrigger p="0" justifyContent="center" cursor="pointer">
              <VETBalance balance={clause.value} flex="1" textAlign="center" />
              <Accordion.ItemIndicator _icon={{ width: '16px', height: '16px', color: 'text-primary' }} />
            </Accordion.ItemTrigger>
          </Flex>

          <ClauseContent index={index} clause={clause} eventLogs={receipt?.outputs[index].events ?? []} />
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}

const ClauseContent = ({ clause, eventLogs, index }: { clause: Clause; eventLogs: RawEvent[]; index: number }) => {
  const [view, setView] = useState<string>(ClauseView.INPUT_DATA)

  return (
    <Accordion.ItemContent>
      <Accordion.ItemBody py={{ base: '4', md: '6' }} display="flex" flexDirection="column" gap="4">
        <ValueSwitch
          layoutId={`clause-${index}`}
          bg="bg-alt-primary"
          values={[ClauseView.INPUT_DATA, ClauseView.EVENTS]}
          activeValue={view}
          onChange={setView}
        />
        {view === ClauseView.INPUT_DATA && <InputData clauseIndex={index} data={clause.data} />}
        {view === ClauseView.EVENTS && <EventsList clauseIndex={index} eventLogs={eventLogs} />}
      </Accordion.ItemBody>
    </Accordion.ItemContent>
  )
}

const ClauseTypeBadge = () => {
  const { t } = useTranslation()

  return (
    <Box bg="highlight-primary/20" px={4} py={1.5} rounded="full">
      <Text textStyle="bodyM" color="highlight-primary">
        {t('Call')}
      </Text>
    </Box>
  )
}
