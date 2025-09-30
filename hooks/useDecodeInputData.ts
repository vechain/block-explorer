'use client'

import { ABIFunction, Hex } from '@vechain/sdk-core'
import type { Abi } from 'viem'
import z from 'zod'
import { type HexString, hexStringSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useAbi } from '@/services/b32'

type InputData = {
  raw: HexString
  decoded?: DecodedInputData
}

export const useDecodeInputData = (hexData: HexString) => {
  const signature = hexStringSchema.parse(hexData.substring(0, 10))

  const { data: abi, ...rest } = useAbi(signature)

  return { data: parseInputData({ abi, signature, hexData }), ...rest }
}

const parseInputData = ({
  abi,
  signature,
  hexData,
}: {
  abi: Abi | undefined
  signature: HexString
  hexData: HexString
}): InputData => {
  const rawDataObject: InputData = { raw: hexData }

  if (!abi) {
    return rawDataObject
  }

  for (const abiItem of abi) {
    if (abiItem.type === 'function') {
      try {
        const functionAbi = new ABIFunction(abiItem)

        if (functionAbi.signatureHash === signature) {
          const decodedInputData = functionAbi.decodeData(Hex.of(hexData))

          const data = {
            signature: functionAbi.format(),
            signatureHash: functionAbi.signatureHash,
            args: decodedInputData.args,
            name: functionAbi.signature.name,
            inputs: functionAbi.signature.inputs,
          }

          const result = zodParse({
            data,
            schema: decodedInputDataSchema,
            errorMessage: 'Failed to parse decoded input data',
          })

          return {
            ...rawDataObject,
            decoded: result,
          }
        }
      } catch (_error) {
        return rawDataObject
      }
    }
  }

  return rawDataObject
}

const decodedInputDataSchema = z.object({
  signature: z.string(),
  signatureHash: z.string(),
  args: z.array(z.any()).optional(),
  name: z.string(),
  inputs: z.array(abi.parameterSchema),
})

export type DecodedInputDataArgs = z.infer<typeof decodedInputDataSchema.shape.args>
export type DecodedInputData = z.infer<typeof decodedInputDataSchema>
