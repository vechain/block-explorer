'use client'

import { Box, Flex, Grid, ScrollArea, Skeleton, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputData as InputDataType } from '@/hooks/useDecodeInputData'
import { type DecodedInputData, useDecodeInputData } from '@/hooks/useDecodeInputData'
import { formatArgForDisplay } from '@/lib/abi-registry'
import type { AddressString, HexString } from '@/lib/schemas'
import { Card } from './ui/Card'
import { ToggleGroup, type ToggleOption } from './ui/ToggleGroup'

enum InputDataView {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const InputData = ({
  clauseIndex,
  data,
  address,
}: {
  clauseIndex: number
  data: HexString
  address?: AddressString | null
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

  return (
    <Card variant="tertiary">
      <Flex>
        <ToggleGroup
          layoutId={`input-data-${clauseIndex}`}
          options={viewOptions}
          value={activeView}
          onChange={setActiveView}
          size="sm"
        />
      </Flex>
      {isPending ? (
        <Card variant="outline">
          <Skeleton height="320px" width="100%" />
        </Card>
      ) : (
        <InputDataViews inputData={inputData} activeView={activeView} />
      )}
    </Card>
  )
}

const InputDataViews = ({ inputData, activeView }: { inputData: InputDataType; activeView: InputDataView }) => {
  if (activeView === InputDataView.DECODED) {
    return <DecodedInputDataTable decodedInputData={inputData.decoded} />
  }

  return (
    <Card variant="outline" overflow="hidden">
      <Text wordBreak="break-all">{inputData.raw}</Text>
    </Card>
  )
}

const DecodedInputDataTable = ({ decodedInputData }: { decodedInputData: DecodedInputData | undefined }) => {
  const { t } = useTranslation()
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (!decodedInputData) {
    return (
      <Card variant="outline">
        <Text>{t('No ABI found')}</Text>
      </Card>
    )
  }

  const templateColumns = '60px 160px 160px 1fr'

  // Mobile: Stack layout with cards
  if (isMobile) {
    return (
      <Stack>
        <Box p="1" bg="bg-primary" borderRadius="4px" width="fit-content">
          <Text textStyle="bodyS" wordBreak="break-all">
            {decodedInputData.signature}
          </Text>
        </Box>
        <Box borderWidth="1px" borderColor="border-primary" borderRadius="md" overflow="hidden">
          {decodedInputData.inputs.map((input, index) => (
            <Box
              key={`${index}-${input.name}`}
              p="3"
              borderBottomWidth={index < decodedInputData.inputs.length - 1 ? '1px' : '0'}
              borderColor="border-primary"
            >
              <Flex justifyContent="space-between" alignItems="center" mb="2">
                <Text fontWeight="semibold" fontSize="sm">
                  #{index} {input.name}
                </Text>
                <Text fontSize="xs" color="text-alt">
                  {input.type}
                </Text>
              </Flex>
              <Text wordBreak="break-all" fontSize="sm">
                {formatArgForDisplay(decodedInputData.args?.[index]) || '0x'}
              </Text>
            </Box>
          ))}
        </Box>
      </Stack>
    )
  }

  // Desktop: Grid layout with horizontal scroll
  return (
    <Stack>
      <Box p="1" bg="bg-primary" borderRadius="4px" width="fit-content">
        <Text textStyle="bodyS" wordBreak="break-all">
          {decodedInputData.signature}
        </Text>
      </Box>
      <ScrollArea.Root size="sm" variant="hover">
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <Box textAlign="center" minW="fit-content">
              <Grid templateColumns={templateColumns} p="4" minW="500px">
                <Text>#</Text>
                <Text>{t('Name')}</Text>
                <Text>{t('Type')}</Text>
                <Text textAlign="left" pl="4">
                  {t('Data')}
                </Text>
              </Grid>

              <Box borderWidth="1px" borderColor="border-primary" borderRadius="md" overflow="hidden">
                {decodedInputData.inputs.map((input, index) => (
                  <Grid
                    key={`${index}-${input.name}`}
                    templateColumns={templateColumns}
                    p="4"
                    minW="500px"
                    borderBottomWidth={index < decodedInputData.inputs.length - 1 ? '1px' : '0'}
                    borderColor="border-primary"
                  >
                    <Text>{index}</Text>
                    <Text>{input.name}</Text>
                    <Text>{input.type}</Text>
                    <Text textAlign="left" pl="4" wordBreak="break-all">
                      {formatArgForDisplay(decodedInputData.args?.[index]) || '0x'}
                    </Text>
                  </Grid>
                ))}
              </Box>
            </Box>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" />
      </ScrollArea.Root>
    </Stack>
  )
}
