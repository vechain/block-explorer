'use client'

import { Accordion, Box, chakra, Flex, Text } from '@chakra-ui/react'
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
      {/*
        Two Accordion.ItemTriggers — both render as <button>. The
        CopyableAddressLink sits between them as a plain sibling so its
        inner copy <button> isn't nested inside a trigger button. The first
        trigger holds the index + (in expert mode) the type badge + the
        resolved contract.method label (all read-only text, safe inside a
        button). The second trigger holds the VET value + chevron. Clicking
        either toggles the panel; clicking the address copies / opens the
        contract page.
      */}
      <Flex alignItems="center" gap="3" px="4" py="3" width="100%">
        <Accordion.ItemTrigger asChild>
          <chakra.button
            type="button"
            flex="0 0 auto"
            width="auto"
            background="transparent"
            border="none"
            padding="0"
            margin="0"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
            gap="3"
            color="inherit"
            font="inherit"
            minW="0"
          >
            <ClauseIndex>{index + 1}</ClauseIndex>
            {expert && <ClauseTypeBadge type={isContractCreation ? 'create' : isTransfer ? 'transfer' : 'call'} />}
            <ClauseLabel clause={clause} />
          </chakra.button>
        </Accordion.ItemTrigger>

        {clause.to ? (
          <Box flex="1" minW="0" display="flex" justifyContent="flex-start" overflow="hidden">
            <CopyableAddressLink truncate address={clause.to} fontSize="sm" />
          </Box>
        ) : (
          <Box flex="1" minW="0">
            <Text textStyle="bodyS" color="text-secondary" fontStyle="italic">
              {t('contract creation')}
            </Text>
          </Box>
        )}

        <Accordion.ItemTrigger asChild>
          <chakra.button
            type="button"
            flex="0 0 auto"
            width="auto"
            background="transparent"
            border="none"
            padding="0"
            margin="0"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
            gap="3"
            color="inherit"
            font="inherit"
          >
            <VETBalance balance={clause.value} textStyle="bodyM" />
            <Accordion.ItemIndicator _icon={{ width: '16px', height: '16px', color: 'text-secondary' }} />
          </chakra.button>
        </Accordion.ItemTrigger>
      </Flex>
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

/**
 * Contract name + (optional) decoded method name. Rendered as inline text
 * inside the first Accordion.ItemTrigger button — no nested-button risk
 * since neither value is interactive.
 */
const ClauseLabel = ({ clause }: { clause: Clause }) => {
  const { name } = useContractName(clause.to ?? null)
  const { data: decoded } = useDecodeInputData(clause.data, clause.to ?? null)
  const methodName = decoded?.decoded?.name

  if (!name && !methodName) return null

  return (
    <Text
      textStyle="bodyM"
      fontWeight="medium"
      color="accent-primary"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      minW="0"
    >
      {name}
      {methodName && (
        <Text as="span" fontStyle="italic" fontWeight="normal">
          {name ? `.${methodName}` : methodName}
        </Text>
      )}
    </Text>
  )
}
