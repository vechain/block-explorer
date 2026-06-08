'use client'

import { Box, Flex, Skeleton, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputData as InputDataType } from '@/hooks/useDecodeInputData'
import { type DecodedInputData, useDecodeInputData } from '@/hooks/useDecodeInputData'
import { formatArgForDisplay } from '@/lib/abi-registry'
import type { AddressString, HexString } from '@/lib/schemas'
import { ToggleGroup, type ToggleOption } from './ui/ToggleGroup'

enum InputDataView {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const InputData = ({
  clauseIndex,
  data,
  address,
  expert = false,
}: {
  clauseIndex: number
  data: HexString
  address?: AddressString | null
  expert?: boolean
}) => {
  const { t } = useTranslation()
  const { data: inputData, isPending } = useDecodeInputData(data, address)
  // Default to the decoded view; the "No ABI found" placeholder in the
  // decoded pane is the user-visible signal when nothing resolved.
  const [activeView, setActiveView] = useState<InputDataView>(InputDataView.DECODED)

  const viewOptions: ToggleOption<InputDataView>[] = useMemo(
    () => [
      { value: InputDataView.RAW, label: t('Raw') },
      { value: InputDataView.DECODED, label: t('Decoded') },
    ],
    [t],
  )

  // Outside of expert mode there's no Raw view, so the toggle adds nothing.
  // Force the decoded pane and rely on its "No ABI found" placeholder.
  const effectiveView = expert ? activeView : InputDataView.DECODED

  return (
    <Stack gap="4">
      <Flex alignItems="center" justifyContent="space-between" gap="3">
        <Text textStyle="bodyM" color="text-secondary">
          {t('Input data')}
        </Text>
        {expert && (
          <ToggleGroup
            layoutId={`input-data-${clauseIndex}`}
            options={viewOptions}
            value={activeView}
            onChange={setActiveView}
            size="sm"
          />
        )}
      </Flex>
      {isPending ? (
        <Skeleton height="120px" width="100%" rounded="md" />
      ) : (
        <InputDataViews inputData={inputData} activeView={effectiveView} expert={expert} />
      )}
    </Stack>
  )
}

const InputDataViews = ({
  inputData,
  activeView,
  expert,
}: {
  inputData: InputDataType
  activeView: InputDataView
  expert: boolean
}) => {
  if (activeView === InputDataView.DECODED) {
    return <DecodedInputDataTable decodedInputData={inputData.decoded} expert={expert} />
  }

  return (
    <Box
      bg="bg-primary"
      rounded="md"
      px="4"
      py="3"
      fontFamily="mono"
      fontSize="sm"
      color="text-primary"
      maxH="240px"
      overflow="auto"
    >
      <Text wordBreak="break-all">{inputData.raw}</Text>
    </Box>
  )
}

const DecodedInputDataTable = ({
  decodedInputData,
  expert,
}: {
  decodedInputData: DecodedInputData | undefined
  expert: boolean
}) => {
  const { t } = useTranslation()
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (!decodedInputData) {
    return (
      <Box borderWidth="1px" borderColor="border-primary" rounded="md" px="3" py="3">
        <Text textStyle="bodyS" color="text-secondary">
          {t('No ABI found')}
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap="3">
      {expert && (
        <Text fontFamily="mono" textStyle="bodyS" color="text-primary" wordBreak="break-all">
          {decodedInputData.signature}
        </Text>
      )}
      <ParamRows
        rows={decodedInputData.inputs.map((input, index) => ({
          name: input.name,
          type: input.type,
          value: formatArgForDisplay(decodedInputData.args?.[index]) || '0x',
        }))}
        isMobile={!!isMobile}
        showType={expert}
      />
    </Stack>
  )
}

interface ParamRow {
  name: string | undefined
  type: string
  value: string
  indexed?: boolean
}

export const ParamRows = ({
  rows,
  isMobile,
  showType = true,
}: {
  rows: ParamRow[]
  isMobile: boolean
  showType?: boolean
}) => {
  const { t } = useTranslation()

  if (rows.length === 0) {
    return null
  }

  // Subtle hairline between rows — same intensity as the inspector design
  // (rgba(255,255,255,.08)) which is lighter than the page-level border so
  // it whispers instead of boxing the table in.
  const rowDivider = 'rgba(255, 255, 255, 0.08)'

  if (isMobile) {
    return (
      <Stack gap="0">
        {rows.map((row, index) => (
          <Box key={`${index}-${row.name}`} py="4" borderTopWidth={index === 0 ? '0' : '1px'} borderColor={rowDivider}>
            <Flex justifyContent="space-between" alignItems="center" mb="2" gap="2">
              <Text textStyle="bodyM" color="text-primary">
                #{index} {row.name}
              </Text>
              <Flex gap="2" alignItems="center" flexShrink={0}>
                {showType && (
                  <Text fontFamily="mono" textStyle="bodyS" color="accent-primary">
                    {row.type}
                  </Text>
                )}
                {row.indexed && (
                  <Text textStyle="bodyXs" color="accent-primary" fontWeight="medium">
                    {t('indexed')}
                  </Text>
                )}
              </Flex>
            </Flex>
            <Text fontFamily="mono" textStyle="bodyS" color="text-primary" wordBreak="break-all">
              {row.value}
            </Text>
          </Box>
        ))}
      </Stack>
    )
  }

  const templateColumns = showType ? '52px 180px 160px minmax(0,1fr)' : '52px 220px minmax(0,1fr)'

  return (
    <Box>
      <Box
        display="grid"
        gridTemplateColumns={templateColumns}
        gap="3"
        px="0"
        pb="3"
        borderBottomWidth="1px"
        borderColor={rowDivider}
      >
        <Text textStyle="bodyXs" textTransform="uppercase" letterSpacing="0.08em" color="text-secondary">
          #
        </Text>
        <Text textStyle="bodyXs" textTransform="uppercase" letterSpacing="0.08em" color="text-secondary">
          {t('Name')}
        </Text>
        {showType && (
          <Text textStyle="bodyXs" textTransform="uppercase" letterSpacing="0.08em" color="text-secondary">
            {t('Type')}
          </Text>
        )}
        <Text textStyle="bodyXs" textTransform="uppercase" letterSpacing="0.08em" color="text-secondary">
          {t('Data')}
        </Text>
      </Box>
      {rows.map((row, index) => (
        <Box
          key={`${index}-${row.name}`}
          display="grid"
          gridTemplateColumns={templateColumns}
          px="0"
          py="4"
          gap="3"
          borderTopWidth={index === 0 ? '0' : '1px'}
          borderColor={rowDivider}
          alignItems="start"
        >
          <Text textStyle="bodyM" color="text-secondary">
            {index}
          </Text>
          <Text textStyle="bodyM" color="text-primary">
            {row.name}
          </Text>
          {showType && (
            <Flex gap="2" alignItems="baseline">
              <Text fontFamily="mono" textStyle="bodyS" color="accent-primary">
                {row.type}
              </Text>
              {row.indexed && (
                <Text textStyle="bodyXs" color="accent-primary" fontWeight="medium">
                  {t('indexed')}
                </Text>
              )}
            </Flex>
          )}
          <Text fontFamily="mono" textStyle="bodyS" color="text-primary" wordBreak="break-all">
            {row.value}
          </Text>
        </Box>
      ))}
    </Box>
  )
}
