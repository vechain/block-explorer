'use client'

import { Accordion, Box, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useContractName } from '@/hooks/useContractName'
import { useDecodeInputData } from '@/hooks/useDecodeInputData'
import type { Clause, Transaction, TransactionReceipt } from '@/lib/schemas/transactions'
import { InputData } from './InputData'
import { VETBalance } from './ui/Balance'
import { CopyableAddressLink } from './ui/Links'

export function TransactionClauses({
  transaction,
  expert = false,
}: {
  transaction: Transaction
  receipt: TransactionReceipt | null
  expert?: boolean
}) {
  return (
    <Accordion.Root
      multiple
      defaultValue={transaction.clauses.length > 0 ? ['0'] : undefined}
      display="flex"
      flexDirection="column"
      gap="3"
    >
      {transaction.clauses.map((clause, index) => (
        <ClauseRow key={index.toString()} clause={clause} index={index} expert={expert} />
      ))}
    </Accordion.Root>
  )
}

const ClauseRow = ({ clause, index, expert }: { clause: Clause; index: number; expert: boolean }) => {
  const { t } = useTranslation()
  const isTransfer = (clause.data === '0x' || clause.data === '0x0') && clause.value > 0n
  const isContractCreation = !clause.to

  return (
    <Accordion.Item
      value={index.toString()}
      borderWidth="1px"
      borderColor="border-primary"
      borderRadius="2xl"
      bg="row-even-bg-primary"
      overflow="hidden"
    >
      <Accordion.ItemTrigger px="4" py="3" cursor="pointer">
        <Flex w="full" alignItems="center" gap="3" justifyContent="space-between">
          <Flex alignItems="center" gap="3" minW="0" flex="1">
            <ClauseIndex>{index + 1}</ClauseIndex>
            {expert && <ClauseTypeBadge type={isContractCreation ? 'create' : isTransfer ? 'transfer' : 'call'} />}
            <ClauseTarget clause={clause} />
          </Flex>
          <Flex alignItems="center" gap="3" flexShrink={0}>
            <VETBalance balance={clause.value} textStyle="bodyM" />
            <Accordion.ItemIndicator _icon={{ width: '16px', height: '16px', color: 'text-secondary' }} />
          </Flex>
        </Flex>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody
          px="4"
          pb="4"
          pt="3"
          borderTopWidth="1px"
          borderColor="border-primary"
          display="flex"
          flexDirection="column"
          gap="3"
        >
          {isTransfer ? (
            <Text textStyle="bodyS" color="text-secondary">
              {t('Plain VET transfer — no contract call data.')}
            </Text>
          ) : (
            <InputData clauseIndex={index} data={clause.data} address={clause.to ?? null} expert={expert} />
          )}
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  )
}

const ClauseIndex = ({ children }: { children: React.ReactNode }) => (
  <Flex
    flexShrink={0}
    alignItems="center"
    justifyContent="center"
    width="26px"
    height="26px"
    borderRadius="lg"
    bg="accent-primary/20"
    color="accent-primary"
    textStyle="bodyS"
    fontWeight="semibold"
  >
    {children}
  </Flex>
)

type ClauseType = 'call' | 'transfer' | 'create'

const ClauseTypeBadge = ({ type }: { type: ClauseType }) => {
  const { t } = useTranslation()
  const config = {
    call: { label: t('Call'), bg: 'accent-primary/20', color: 'accent-primary' },
    transfer: { label: t('Transfer'), bg: 'success-surface', color: 'success-text' },
    create: { label: t('Create'), bg: 'pending-surface', color: 'pending-text' },
  }[type]
  return (
    <Box bg={config.bg} px="3" py="1" rounded="full" flexShrink={0}>
      <Text textStyle="bodyS" fontWeight="semibold" color={config.color}>
        {config.label}
      </Text>
    </Box>
  )
}

const ClauseTarget = ({ clause }: { clause: Clause }) => {
  const { t } = useTranslation()
  const { name } = useContractName(clause.to ?? null)
  // Re-uses the same decode the InputData panel triggers below — React
  // Query dedupes, so this is free. We just want the method name for the
  // header.
  const { data: decoded } = useDecodeInputData(clause.data, clause.to ?? null)
  const methodName = decoded?.decoded?.name

  if (!clause.to) {
    return (
      <Text textStyle="bodyS" color="text-secondary" fontStyle="italic">
        {t('contract creation')}
      </Text>
    )
  }

  // The clause header sits inside an Accordion.ItemTrigger, so a click on
  // the address link or its copy button would otherwise bubble up and
  // toggle the panel. Wrap just the interactive address controls so the
  // surrounding header area still toggles the accordion as expected.
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <Flex alignItems="center" gap="2" minW="0" flex="1" overflow="hidden">
      {name && (
        <Text textStyle="bodyS" fontWeight="medium" color="accent-primary" whiteSpace="nowrap" flexShrink={0}>
          {name}
        </Text>
      )}
      <Box
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        display="inline-flex"
        alignItems="center"
        minW="0"
      >
        <CopyableAddressLink truncate address={clause.to} fontSize="sm" />
      </Box>
      {methodName && (
        <Text
          textStyle="bodyM"
          fontFamily="mono"
          color="text-primary"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          minW="0"
        >
          · {methodName}
        </Text>
      )}
    </Flex>
  )
}
