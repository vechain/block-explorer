import { Card, Code as ChakraCode, Table, Text } from '@chakra-ui/react'
import type { AbiParameter } from 'viem'
import { Code } from '@/components/ui/Code'
import { useDecodeInputData } from '@/hooks/useDecodeInputData'
import type { DecodedInputData, DecodedInputDataArgs, HexString } from '@/lib/schemas'

export const InputData = ({ rawData }: { rawData: HexString }) => {
  const { data } = useDecodeInputData(rawData)

  return data.decoded ? <CardDecodedInputData inputData={data.decoded} /> : <Code>{data.raw}</Code>
}

const CardDecodedInputData = ({ inputData }: { inputData: DecodedInputData }) => {
  return (
    <Card.Root>
      <Card.Body>
        <Text fontSize="md" mb="8">
          Function : <ChakraCode color="fg.info">{inputData.signature}</ChakraCode>
        </Text>
        <DecodedInputDataArgsTable inputs={inputData.inputs} args={inputData.args} />
      </Card.Body>
    </Card.Root>
  )
}

const DecodedInputDataArgsTable = ({ inputs, args }: { inputs: AbiParameter[]; args: DecodedInputDataArgs }) => {
  return (
    <Table.Root size="sm" variant="line">
      <Table.Body>
        {inputs.map((input, i) => (
          <Table.Row key={`${i}-${input.name}`}>
            <Table.Cell>
              <ChakraCode color="fg.info">{input.name}</ChakraCode>
            </Table.Cell>
            <Table.Cell>
              <Text fontSize="xs" fontStyle="italic">
                {input.type}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Code w="100%" whiteSpace="normal" wordBreak="break-all">
                {args[i] ?? '0x'}
              </Code>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
