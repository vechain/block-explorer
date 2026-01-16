'use client'

import { Box, Flex, Grid, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputData as InputDataType } from '@/hooks/useDecodeInputData'
import { type DecodedInputData, useDecodeInputData } from '@/hooks/useDecodeInputData'
import type { HexString } from '@/lib/schemas'
import { Card } from './ui/Card'
import { ToggleGroup, type ToggleOption } from './ui/ToggleGroup'

enum InputDataView {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const InputData = ({ clauseIndex, data }: { clauseIndex: number; data: HexString }) => {
  const { t } = useTranslation()
  const { data: inputData, isLoading } = useDecodeInputData(data)
  const isDecoded = !!inputData?.decoded
  const [view, setView] = useState<InputDataView>(() => (isDecoded ? InputDataView.DECODED : InputDataView.RAW))

  const viewOptions: ToggleOption<InputDataView>[] = useMemo(
    () => [
      { value: InputDataView.RAW, label: t('Raw') },
      { value: InputDataView.DECODED, label: t('Decoded') },
    ],
    [t],
  )

  return (
    <Card variant="secondary">
      <Flex>
        <ToggleGroup
          layoutId={`input-data-${clauseIndex}`}
          options={viewOptions}
          value={view}
          onChange={setView}
          size="sm"
        />
      </Flex>
      {isLoading ? (
        <Card variant="outline">
          <Skeleton height="320px" width="100%" />
        </Card>
      ) : (
        <InputDataViews inputData={inputData} activeView={view} />
      )}
    </Card>
  )
}

const InputDataViews = ({ inputData, activeView }: { inputData: InputDataType; activeView: InputDataView }) => {
  if (activeView === InputDataView.DECODED) {
    return <DecodedInputDataTable decodedInputData={inputData.decoded} />
  }

  return <Card variant="outline">{inputData.raw}</Card>
}

const DecodedInputDataTable = ({ decodedInputData }: { decodedInputData: DecodedInputData | undefined }) => {
  const { t } = useTranslation()

  if (!decodedInputData) {
    return (
      <Card variant="outline">
        <Text>{t('No ABI found')}</Text>
      </Card>
    )
  }

  const templateColumns = '60px 160px 160px 1fr'

  return (
    <Stack>
      <Box p="1" bg="bg-primary" borderRadius="4px" width="fit-content">
        <Text textStyle="bodyS">{decodedInputData.signature}</Text>
      </Box>
      <Box textAlign="center">
        <Grid templateColumns={templateColumns} p="4">
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
              borderBottomWidth={index < decodedInputData.inputs.length - 1 ? '1px' : '0'}
              borderColor="border-primary"
            >
              <Text>{index}</Text>
              <Text>{input.name}</Text>
              <Text>{input.type}</Text>
              <Text textAlign="left" pl="4">
                {decodedInputData.args?.[index] ?? '0x'}
              </Text>
            </Grid>
          ))}
        </Box>
      </Box>
    </Stack>
  )
}
