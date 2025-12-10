import { Box, Grid, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import type { InputData as InputDataType } from '@/hooks/useDecodeInputData'
import { type DecodedInputData, useDecodeInputData } from '@/hooks/useDecodeInputData'
import type { HexString } from '@/lib/schemas'
import { BorderedSurface, SurfaceAlt } from './ui/Surface'
import { ValueSwitch } from './ui/ValueSwitch'

enum InputDataView {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const InputData = ({ clauseIndex, data }: { clauseIndex: number; data: HexString }) => {
  const { data: inputData, isLoading } = useDecodeInputData(data)
  const isDecoded = !!inputData?.decoded
  const [view, setView] = useState<string>(() => (isDecoded ? InputDataView.DECODED : InputDataView.RAW))

  return (
    <SurfaceAlt>
      <ValueSwitch
        layoutId={`input-data-${clauseIndex}`}
        bg="bg-surface-alt"
        values={[InputDataView.RAW, InputDataView.DECODED]}
        activeValue={view}
        onChange={setView}
      />
      {isLoading ? (
        <BorderedSurface>
          <Skeleton height="320px" width="100%" />
        </BorderedSurface>
      ) : (
        <InputDataViews inputData={inputData} activeView={view as InputDataView} />
      )}
    </SurfaceAlt>
  )
}

const InputDataViews = ({ inputData, activeView }: { inputData: InputDataType; activeView: InputDataView }) => {
  if (activeView === InputDataView.DECODED) {
    return <DecodedInputDataTable decodedInputData={inputData.decoded} />
  }

  return <BorderedSurface>{inputData.raw}</BorderedSurface>
}

const DecodedInputDataTable = ({ decodedInputData }: { decodedInputData: DecodedInputData | undefined }) => {
  if (!decodedInputData) {
    return (
      <BorderedSurface>
        <Text>No ABI found</Text>
      </BorderedSurface>
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
          <Text>Name</Text>
          <Text>Type</Text>
          <Text textAlign="left" pl="4">
            Data
          </Text>
        </Grid>

        <Box borderWidth="1px" borderColor="border-surface" borderRadius="md" overflow="hidden">
          {decodedInputData.inputs.map((input, index) => (
            <Grid
              key={`${index}-${input.name}`}
              templateColumns={templateColumns}
              p="4"
              borderBottomWidth={index < decodedInputData.inputs.length - 1 ? '1px' : '0'}
              borderColor="border-surface">
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
